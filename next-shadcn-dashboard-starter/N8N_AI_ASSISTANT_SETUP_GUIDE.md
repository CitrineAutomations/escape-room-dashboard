# N8N AI Assistant Setup Guide for Escape Room Dashboard

This guide provides **two versions** of the N8N workflow:
1. **Advanced Version** (`escape-room-ai-assistant-n8n-workflow.json`) - Uses specialized OpenAI nodes
2. **Simple Version** (`escape-room-ai-assistant-simple.json`) - Uses basic HTTP Request nodes (more compatible)

## Prerequisites

Before setting up the N8N AI Assistant, ensure you have:

1. **N8N Instance** - Either cloud (n8n.cloud) or self-hosted
2. **OpenAI API Key** - From https://platform.openai.com/api-keys
3. **Supabase Project** - With the escape room database set up
4. **Supabase API Key** - Service role key (not anon key)
5. **N8N Credentials** - Admin access to create workflows

## Choosing the Right Version

### Use Advanced Version if:
- You have N8N version 1.0+ with LangChain support
- You want the most optimized workflow
- You have OpenAI node support

### Use Simple Version if:
- You're getting import errors with the advanced version
- You have an older N8N installation
- You want maximum compatibility
- The advanced version doesn't work

## Setup Instructions

### Step 1: Import the Workflow

**Try Advanced Version First:**
1. Download `escape-room-ai-assistant-n8n-workflow.json`
2. In N8N, go to **Workflows** → **Import from File**
3. Select the downloaded JSON file

**If Advanced Version Fails, Use Simple Version:**
1. Download `escape-room-ai-assistant-simple.json`
2. In N8N, go to **Workflows** → **Import from File**
3. Select the simple version JSON file

### Step 2: Configure Credentials

#### For Advanced Version:

**OpenAI Credentials:**
1. Go to **Settings** → **Credentials**
2. Click **Create Credential** → **OpenAI**
3. Name: `OpenAI API`
4. API Key: Your OpenAI API key
5. Save

**Supabase Credentials:**
1. Click **Create Credential** → **Supabase**
2. Name: `Supabase API`
3. Host: Your Supabase project URL (e.g., `https://abcdefgh.supabase.co`)
4. Service Role Secret: Your Supabase service_role key
5. Save

#### For Simple Version:

**OpenAI HTTP Header Auth:**
1. Go to **Settings** → **Credentials**
2. Click **Create Credential** → **Header Auth**
3. Name: `OpenAI API Key`
4. Name: `Authorization`
5. Value: `Bearer YOUR_OPENAI_API_KEY`
6. Save

**Supabase Credentials:**
Same as advanced version above.

### Step 3: Update Webhook Path

1. Open the imported workflow
2. Click on the **Webhook** node
3. Verify the path is: `9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6`
4. Note the full webhook URL shown (e.g., `https://your-n8n.app.n8n.cloud/webhook/9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6`)

### Step 4: Activate the Workflow

1. Click **Save** in the workflow
2. Toggle **Active** to ON
3. The webhook is now live and ready to receive requests

## Troubleshooting Import Issues

### Error: "Problem importing workflow: Could not find property option"

**Solution 1: Use Simple Version**
- Download and import `escape-room-ai-assistant-simple.json` instead
- This uses basic HTTP Request nodes that work on all N8N versions

**Solution 2: Update N8N**
- Update your N8N installation to the latest version
- Ensure LangChain nodes are available

**Solution 3: Manual Node Creation**
If both versions fail, create the workflow manually:

1. **Create Webhook Node:**
   - Type: `n8n-nodes-base.webhook`
   - Path: `9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6`

2. **Create HTTP Request Node for OpenAI:**
   - URL: `https://api.openai.com/v1/chat/completions`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_API_KEY`, `Content-Type: application/json`
   - Body: JSON with messages array

3. **Create Supabase Node:**
   - Operation: Execute Query
   - Query: `={{ previous_node_sql_result }}`

### Error: "Credentials not found"

1. Ensure credentials are created with exact names referenced in the workflow
2. For simple version: Use "OpenAI API Key" as HTTP Header Auth credential name
3. For advanced version: Use "OpenAI API" as OpenAI credential name

### Error: "Webhook not accessible"

1. Check if workflow is activated
2. Verify webhook URL in browser (should show method not allowed for GET)
3. Test with POST request using curl or Postman

## Testing the Workflow

### Test with curl:

```bash
curl -X POST "https://your-n8n.app.n8n.cloud/webhook/9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the utilization rate for Green Light Escape today?"
  }'
```

### Expected Response:

```json
{
  "success": true,
  "query": "What is the utilization rate for Green Light Escape today?",
  "sql_query": "SELECT ...",
  "raw_data": [...],
  "response": "Based on today's data, Green Light Escape has a utilization rate of...",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data_points": 24
}
```

### Sample Questions to Test:

1. "What is the utilization rate for iEscape Rooms this week?"
2. "Which rooms are most popular at Cracked IT?"
3. "Show me availability for The Exit Games tomorrow"
4. "Compare booking rates across all businesses today"
5. "What are the peak hours for Green Light Escape?"

## Integration with Dashboard

In your dashboard AI assistant page, use this JavaScript to call the webhook:

```javascript
const response = await fetch('https://your-n8n.app.n8n.cloud/webhook/9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: userQuestion
  })
});

const result = await response.json();
console.log(result.response); // Business-friendly response
```

## Performance Optimization

1. **Cache Results:** Consider caching common queries for 5-10 minutes
2. **Limit Tokens:** Adjust maxTokens in OpenAI nodes based on needs
3. **Query Optimization:** Use LIMIT clauses in generated SQL for large datasets
4. **Error Handling:** Implement retry logic for API failures

## Security Considerations

1. **API Keys:** Store in N8N credentials, never in workflow JSON
2. **Database Access:** Use least-privilege Supabase service key
3. **Input Validation:** The workflow validates query input
4. **Rate Limiting:** Consider implementing rate limits on webhook endpoint

## Monitoring and Maintenance

1. **Check Executions:** Monitor workflow executions in N8N
2. **API Usage:** Monitor OpenAI API usage and costs
3. **Database Performance:** Watch Supabase query performance
4. **Error Logs:** Review failed executions regularly

## Support

If you continue having issues:

1. Check N8N version compatibility
2. Review N8N execution logs
3. Test individual nodes manually
4. Verify all credentials are correctly configured
5. Try the simple version if advanced version fails

The simple version should work on any N8N installation and provides the same functionality using basic HTTP Request nodes. 