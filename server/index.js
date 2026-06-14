import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const port = process.env.PORT || 8787

app.use(express.json({ limit: '1mb' }))

function createOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

function requireOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('Missing OPENAI_API_KEY in .env')
    error.status = 500
    throw error
  }
}

app.post('/api/advice', async (req, res, next) => {
  try {
    requireOpenAIKey()

    const { inputs, result } = req.body
    if (!inputs || !result?.score) {
      return res.status(400).json({ error: 'Missing inputs or result.score' })
    }

    const summary = [
      `Media: ${inputs.mediaType}`,
      `Category: ${inputs.category}`,
      `Account: ${inputs.accountType}`,
      `Followers: ${inputs.followers}`,
      `Hour UTC: ${inputs.postHour}`,
      `Day: ${inputs.dayOfWeek}`,
      `Caption length: ${inputs.captionLength} chars`,
      `Hashtags: ${inputs.hashtagCount}`,
      `CTA: ${inputs.cta}`,
      `Viral Score: ${result.score}%`,
    ].join(', ')

    const openai = createOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 320,
      messages: [
        {
          role: 'system',
          content: 'You are ViralIQ, an expert Instagram content strategist. Be specific, actionable, concise, and write under 220 words. Use bullet points.',
        },
        {
          role: 'user',
          content: `Based on these post parameters: ${summary}

Give 4-5 specific tips to improve viral potential. Reference that save_rate and share_rate are the top predictors. Be concrete.`,
        },
      ],
    })

    res.json({ advice: completion.choices[0]?.message?.content || 'No advice generated.' })
  } catch (error) {
    next(error)
  }
})

const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  const status = error.status || 500
  const message = status === 500 ? 'AI advice unavailable. Check server logs and OPENAI_API_KEY.' : error.message
  console.error(error)
  res.status(status).json({ error: message })
})

app.listen(port, () => {
  console.log(`ViralIQ server running at http://localhost:${port}`)
})
