# Render Environment Setup

The Express backend serves the chatbot endpoint at `/api/ai/chat`. Configure provider keys on the Render backend service only. Never put provider keys in the frontend or commit them to this repository.

## OpenAI chatbot

In the Render dashboard, open the web service, choose **Environment**, and add:

| Variable | Value |
| --- | --- |
| `AI_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | Your OpenAI API key, stored as a secret in Render |
| `OPENAI_MODEL` | `gpt-4o-mini` (or another model enabled for your API project) |

Keep existing backend variables such as `MONGO_URI`, `RESEND_API_KEY`, and other service credentials configured in Render. Save changes and wait for Render to redeploy. Check the service logs for `[OpenAI] Successfully got response` after sending a chat message.

The OpenAI key is used only by the backend. Do not create a `REACT_APP_OPENAI_API_KEY` or add the key to Vercel.

## Frontend on Vercel

The frontend already posts chat messages to the backend URL in `src/config/api.js`. If deploying the frontend separately on Vercel, set `REACT_APP_API_URL` to the public Render backend URL, then redeploy the frontend. Do not set any AI provider key in Vercel.

## Rotating exposed credentials

If a provider or service credential was previously committed to the repository, revoke or rotate it in that provider's dashboard, then update the corresponding secret in Render. Removing a value from the current files does not erase it from the repository's earlier history.
