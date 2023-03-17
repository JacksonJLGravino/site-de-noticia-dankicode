const express = require('express')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')

const path = require('path')

const app = express()

const Posts = require('./posts.js')
const userName = ''
const collectionName = ''

mongoose
  .connect(
    'mongodb+srv://' +
      userName +
      ':admin@cluster0.ogzahuq.mongodb.net/' +
      collectionName +
      '?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(function () {
    console.log('conectado com sucesso')
  })
  .catch(function (err) {
    console.log(err.message)
  })

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.use('/public', express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, '/pages'))

app.get('/', (req, res) => {
  console.log(req.query)

  if (req.query.busca == null) {
    Posts.find({})
      .sort({ _id: -1 })
      .then(posts => {
        posts = posts.map(function (val) {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria
          }
        })
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .then(postsTop => {
            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views
              }
            })
            res.render('home', { posts: posts, postsTop: postsTop })
          })
          .catch(err => {
            console.log(err.message)
          })
      })
      .catch(err => {
        console.log(err.message)
      })
  } else {
    Posts.find({ titulo: { $regex: req.query.busca, $options: 'i' } })
      .then(posts => {
        posts = posts.map(function (val) {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 500),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
            views: val.views
          }
        })
        res.render('busca', { posts: posts, contagem: posts.length })
      })
      .catch(err => {
        console.log(err.message)
      })
  }
})

app.get('/:slug', (req, res) => {
  //res.send(req.params.slug)
  Posts.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true }
  )
    .then(resposta => {
      if (resposta != null) {
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .then(postsTop => {
            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views
              }
            })
            res.render('single', { noticia: resposta, postsTop: postsTop })
          })
          .catch(err => {
            console.log(err.message)
          })
      } else {
        res.redirect('/')
      }
    })
    .catch(err => {
      console.log(err.message)
    })
})

app.listen(3000, () => {
  console.log('servidor rodadno')
})
