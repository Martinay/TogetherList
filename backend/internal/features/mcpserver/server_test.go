package mcpserver

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

func setupTestServer(t *testing.T) (*Server, *events.FileEventStore, string) {
	tempDir := t.TempDir()
	store := events.NewFileEventStoreWithDir(tempDir)
	s := NewServer(store)
	return s, store, tempDir
}

func TestServer_DirectJSONRPC_InitializeAndPing(t *testing.T) {
	s, _, _ := setupTestServer(t)

	// 1. Initialize
	initReq := `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0"}}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(initReq))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	s.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var initResp struct {
		JSONRPC string `json:"jsonrpc"`
		ID      int    `json:"id"`
		Result  struct {
			ServerInfo struct {
				Name string `json:"name"`
			} `json:"serverInfo"`
		} `json:"result"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &initResp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if initResp.Result.ServerInfo.Name != "TogetherList" {
		t.Errorf("expected server name TogetherList, got %s", initResp.Result.ServerInfo.Name)
	}

	// 2. Ping
	pingReq := `{"jsonrpc":"2.0","id":2,"method":"ping"}`
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(pingReq))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestServer_DirectJSONRPC_ToolsList(t *testing.T) {
	s, _, _ := setupTestServer(t)

	toolsReq := `{"jsonrpc":"2.0","id":3,"method":"tools/list"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(toolsReq))
	rr := httptest.NewRecorder()

	s.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Result struct {
			Tools []struct {
				Name string `json:"name"`
			} `json:"tools"`
		} `json:"result"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode tools list: %v", err)
	}

	expectedTools := []string{
		"list_lists",
		"get_list",
		"create_list",
		"rename_list",
		"add_item",
		"complete_item",
		"assign_item",
		"update_item_title",
		"update_item_description",
	}

	foundMap := make(map[string]bool)
	for _, tool := range resp.Result.Tools {
		foundMap[tool.Name] = true
	}

	for _, expected := range expectedTools {
		if !foundMap[expected] {
			t.Errorf("expected tool %s not found in tools/list response", expected)
		}
	}
}

func TestServer_ToolLifecycle_CreateGetAddItemCompleteAssignRename(t *testing.T) {
	s, _, _ := setupTestServer(t)

	// 1. Create list
	createPayload := `{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"create_list","arguments":{"name":"Party Planning","creator":"Alice","participants":["Alice","Bob"]}}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(createPayload))
	rr := httptest.NewRecorder()
	s.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var callResp struct {
		Result struct {
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"content"`
			IsError bool `json:"isError"`
		} `json:"result"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &callResp); err != nil {
		t.Fatalf("failed to decode create_list response: %v", err)
	}
	if callResp.Result.IsError {
		t.Fatalf("create_list returned error: %v", callResp.Result.Content[0].Text)
	}

	var createData struct {
		ListID       string   `json:"listId"`
		Name         string   `json:"name"`
		Participants []string `json:"participants"`
	}
	if err := json.Unmarshal([]byte(callResp.Result.Content[0].Text), &createData); err != nil {
		t.Fatalf("failed to decode text content: %v", err)
	}
	if createData.ListID == "" || createData.Name != "Party Planning" {
		t.Fatalf("unexpected createData: %+v", createData)
	}
	listID := createData.ListID

	// 2. Add Item
	addPayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":11,"method":"tools/call","params":{"name":"add_item","arguments":{"list_id":"%s","title":"Buy balloons","created_by":"Alice"}}}`, listID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(addPayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)

	if err := json.Unmarshal(rr.Body.Bytes(), &callResp); err != nil {
		t.Fatalf("failed to decode add_item response: %v", err)
	}
	if callResp.Result.IsError {
		t.Fatalf("add_item returned error: %v", callResp.Result.Content[0].Text)
	}

	var addData struct {
		ItemID string `json:"itemId"`
		Title  string `json:"title"`
	}
	if err := json.Unmarshal([]byte(callResp.Result.Content[0].Text), &addData); err != nil {
		t.Fatalf("failed to decode addData: %v", err)
	}
	itemID := addData.ItemID
	if itemID == "" || addData.Title != "Buy balloons" {
		t.Fatalf("unexpected addData: %+v", addData)
	}

	// 3. Update Item Title
	renameTitlePayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":12,"method":"tools/call","params":{"name":"update_item_title","arguments":{"list_id":"%s","item_id":"%s","title":"Buy colorful balloons"}}}`, listID, itemID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(renameTitlePayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("update_item_title failed: %v", callResp.Result.Content[0].Text)
	}

	// 4. Update Item Description
	descPayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":13,"method":"tools/call","params":{"name":"update_item_description","arguments":{"list_id":"%s","item_id":"%s","description":"At least 20 red and blue balloons"}}}`, listID, itemID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(descPayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("update_item_description failed: %v", callResp.Result.Content[0].Text)
	}

	// 5. Assign Item
	assignPayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":14,"method":"tools/call","params":{"name":"assign_item","arguments":{"list_id":"%s","item_id":"%s","assigned_to":["Bob"]}}}`, listID, itemID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(assignPayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("assign_item failed: %v", callResp.Result.Content[0].Text)
	}

	// 6. Complete Item
	completePayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":15,"method":"tools/call","params":{"name":"complete_item","arguments":{"list_id":"%s","item_id":"%s","completed":true,"completed_by":"Bob"}}}`, listID, itemID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(completePayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("complete_item failed: %v", callResp.Result.Content[0].Text)
	}

	// 7. Rename List
	renameListPayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":16,"method":"tools/call","params":{"name":"rename_list","arguments":{"list_id":"%s","name":"Birthday Bash","renamed_by":"Alice"}}}`, listID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(renameListPayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("rename_list failed: %v", callResp.Result.Content[0].Text)
	}

	// 8. Get List and verify aggregate state
	getPayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":17,"method":"tools/call","params":{"name":"get_list","arguments":{"list_id":"%s"}}}`, listID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(getPayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("get_list failed: %v", callResp.Result.Content[0].Text)
	}

	var stateData struct {
		Name         string                        `json:"name"`
		Participants []string                      `json:"participants"`
		Items        map[string]*events.ItemState `json:"items"`
	}
	if err := json.Unmarshal([]byte(callResp.Result.Content[0].Text), &stateData); err != nil {
		t.Fatalf("failed to decode stateData: %v", err)
	}

	if stateData.Name != "Birthday Bash" {
		t.Errorf("expected list name 'Birthday Bash', got %q", stateData.Name)
	}
	item, exists := stateData.Items[itemID]
	if !exists {
		t.Fatalf("expected item %s in state", itemID)
	}
	if item.Title != "Buy colorful balloons" {
		t.Errorf("expected title 'Buy colorful balloons', got %q", item.Title)
	}
	if item.Description != "At least 20 red and blue balloons" {
		t.Errorf("expected description 'At least 20 red and blue balloons', got %q", item.Description)
	}
	if !item.Completed || item.CompletedBy != "Bob" {
		t.Errorf("expected item completed by Bob, got completed=%v by=%s", item.Completed, item.CompletedBy)
	}
	if len(item.AssignedTo) != 1 || item.AssignedTo[0] != "Bob" {
		t.Errorf("expected item assigned to Bob, got %v", item.AssignedTo)
	}

	// 9. List Lists
	listListsPayload := `{"jsonrpc":"2.0","id":18,"method":"tools/call","params":{"name":"list_lists","arguments":{}}}`
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(listListsPayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if callResp.Result.IsError {
		t.Fatalf("list_lists failed: %v", callResp.Result.Content[0].Text)
	}

	var summaries []ListSummary
	if err := json.Unmarshal([]byte(callResp.Result.Content[0].Text), &summaries); err != nil {
		t.Fatalf("failed to decode summaries: %v", err)
	}
	if len(summaries) != 1 || summaries[0].ID != listID || summaries[0].Name != "Birthday Bash" {
		t.Errorf("unexpected summaries: %+v", summaries)
	}

	// 10. Read Resource list://{listId}
	readResourcePayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":19,"method":"resources/read","params":{"uri":"list://%s"}}}`, listID)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(readResourcePayload))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)

	var resourceResp struct {
		Result struct {
			Contents []struct {
				URI      string `json:"uri"`
				MIMEType string `json:"mimeType"`
				Text     string `json:"text"`
			} `json:"contents"`
		} `json:"result"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &resourceResp); err != nil {
		t.Fatalf("failed to decode resource response: %v", err)
	}
	if len(resourceResp.Result.Contents) != 1 {
		t.Fatalf("expected 1 resource content, got %d", len(resourceResp.Result.Contents))
	}
	if !strings.Contains(resourceResp.Result.Contents[0].Text, "Birthday Bash") {
		t.Errorf("expected resource text to contain 'Birthday Bash', got %s", resourceResp.Result.Contents[0].Text)
	}
}

func TestServer_ErrorHandling(t *testing.T) {
	s, _, _ := setupTestServer(t)

	// Non-existent list get_list
	fakeID := uuid.New().String()
	getPayload := fmt.Sprintf(`{"jsonrpc":"2.0","id":20,"method":"tools/call","params":{"name":"get_list","arguments":{"list_id":"%s"}}}`, fakeID)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString(getPayload))
	rr := httptest.NewRecorder()
	s.ServeHTTP(rr, req)

	var callResp struct {
		Result struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
			IsError bool `json:"isError"`
		} `json:"result"`
	}
	_ = json.Unmarshal(rr.Body.Bytes(), &callResp)
	if !callResp.Result.IsError {
		t.Errorf("expected isError true for non-existent list")
	}

	// Invalid JSON body
	req = httptest.NewRequest(http.MethodPost, "/api/v1/mcp", bytes.NewBufferString("{invalid json}"))
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON body, got %d", rr.Code)
	}

	// Method not allowed (GET on direct POST endpoint)
	req = httptest.NewRequest(http.MethodGet, "/api/v1/mcp", nil)
	rr = httptest.NewRecorder()
	s.ServeHTTP(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405 for GET on /api/v1/mcp, got %d", rr.Code)
	}
}

type pipeResponseWriter struct {
	header http.Header
	writer *io.PipeWriter
	code   int
}

func (p *pipeResponseWriter) Header() http.Header { return p.header }
func (p *pipeResponseWriter) Write(b []byte) (int, error) { return p.writer.Write(b) }
func (p *pipeResponseWriter) WriteHeader(code int) { p.code = code }
func (p *pipeResponseWriter) Flush() {}

func TestServer_SSEServer_Lifecycle(t *testing.T) {
	s, _, _ := setupTestServer(t)
	sseServer := s.SSEServer()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pr, pw := io.Pipe()
	defer pr.Close()
	defer pw.Close()

	w := &pipeResponseWriter{
		header: make(http.Header),
		writer: pw,
	}

	sseReq := httptest.NewRequest(http.MethodGet, "/api/v1/mcp/sse", nil).WithContext(ctx)

	go func() {
		sseServer.ServeHTTP(w, sseReq)
	}()

	reader := bufio.NewReader(pr)

	// Read first SSE event which should be 'endpoint'
	var endpointLine string
	for i := 0; i < 10; i++ {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("failed reading SSE stream: %v", err)
		}
		if strings.HasPrefix(line, "data: ") {
			endpointLine = strings.TrimSpace(strings.TrimPrefix(line, "data: "))
			break
		}
	}

	if endpointLine == "" {
		t.Fatalf("did not find endpoint data in SSE stream")
	}

	// Send an initialize request to the message endpoint
	initBody := `{"jsonrpc":"2.0","id":100,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"sse-test","version":"1.0"}}}`
	postReq := httptest.NewRequest(http.MethodPost, endpointLine, bytes.NewBufferString(initBody))
	postReq.Header.Set("Content-Type", "application/json")
	postRR := httptest.NewRecorder()

	sseServer.ServeHTTP(postRR, postReq)

	if postRR.Code != http.StatusAccepted {
		t.Fatalf("expected status 202 Accepted, got %d: %s", postRR.Code, postRR.Body.String())
	}

	// Read response back from the SSE stream
	var messageReceived string
	for i := 0; i < 10; i++ {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("failed reading message from SSE: %v", err)
		}
		if strings.HasPrefix(line, "data: ") {
			messageReceived = strings.TrimSpace(strings.TrimPrefix(line, "data: "))
			break
		}
	}

	if !strings.Contains(messageReceived, "TogetherList") {
		t.Errorf("expected SSE message to contain 'TogetherList', got %s", messageReceived)
	}

	cancel()
	sseServer.CloseSessions()
	time.Sleep(20 * time.Millisecond)
}

