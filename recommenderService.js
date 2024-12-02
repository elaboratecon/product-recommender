const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const app = express()

// set port
const PORT = 6060

const RECOMMENDATIONS_FILE = path.join(__dirname, 'recommendations.js')

app.use(cors())
app.use(express.json())

const readRecommendations = () => {
    delete require.cache[require.resolve('./recommendations')] // Clear cache to get fresh data
    return require('./recommendations')
}

const writeRecommendations = (data) => {
    const fileContent = `module.exports = ${JSON.stringify(data, null, 4)};`
    fs.writeFileSync(RECOMMENDATIONS_FILE, fileContent, 'utf8')
}

// GET request
app.get('/:id', (req, res) => {
    const { id } = req.params

    try {
        const recommendations = readRecommendations()
        const result = recommendations.find(({ productId }) => productId === id) ?? []
        res.status(200).json(result)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// POST
app.post('/', (req, res) => {
    const { body } = req
    const { productId } = body

    try {
        const recommendations = readRecommendations()
        const match = recommendations.find((item) => item.productId === productId)

        if (match) {
            res.status(409).json({ message: 'Write Error: productId already exists' })
        } else {
            // add new recommendation to the file
            recommendations.push(body)
            writeRecommendations(recommendations)
            res.status(201).json({ message: 'Recommendation added successfully', data: body })
        }
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// PATCH
app.patch('/', (req, res) => {
    const { body } = req
    const { productId, recommendedProductIds } = body

    try {
        const recommendations = readRecommendations()
        const match = recommendations.find((item) => item.productId === productId)

        if (!match) {
            res.status(404).json({ message: 'productId not found' })
        } else {
            // dedupes ids using a set
            match.recommendedProductIds = [...new Set(recommendedProductIds)]
            writeRecommendations(recommendations)
            res.status(200).json({
                message: 'Updated successfully',
                updatedRecommendation: match,
            })
        }
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// start the server
app.listen(PORT, () => {
    console.log(`CORS-enabled web server listening on port ${PORT}...`)
})
