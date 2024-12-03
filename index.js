import express from 'express'
import crypto from 'node:crypto'
import cors from 'cors'
import movies from './movies.json' with { type: "json"}
import { validateMovie, validatePartialMovie } from './schemas/movies.js'

const app = express()
app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'http://localhost:3000',
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))
app.disable('x-powered-by') 


// falta el CORS PRE-Flight
// crear header OPTIONS

app.get('/movies', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    // o 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos proximamente...
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // esto no seguiria los principios REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})

 
// metodo declarativo que equivale a => app.use(express.json())

{/* 
app.use((req, res, next) => {
   if (req.method !== 'POST') return next()
   if (req.headers['content-type'] !== 'application/json') return next()

   // solo llegan request que son POST y que tienen el header Content-Type: application/json
   let body = ''

   // escuchar el evento data
   req.on('data', chunk => {
     body += chunk.toString()
   })

   req.on('end', () => {
     const data = JSON.parse(body)
     data.timestamp = Date.now()
     // mutar la request y meter la información en el req.body
     req.body = data
     next()
   })
 })

    */}