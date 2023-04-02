const express = require('express')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')
var session = require('express-session')
const fileupload = require('express-fileupload')
const fs = require('fs')

const path = require('path')

const app = express()

const Posts = require('./posts.js')
const userName = 'root'
const collectionName = 'dankicode'

app.use(
  session({
    secret: 'keyboard cat',
    cookie: { maxAge: 60000 }
  })
)

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

app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
  })
)

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

var usuarios = [
  {
    login: 'jackson',
    senha: '123456'
  }
]

app.post('/admin/login', (req, res) => {
  usuarios.map(function (val) {
    if (val.login == req.body.login && val.senha == req.body.senha) {
      req.session.login = 'JackBoy'
    }
  })
  res.redirect('/admin/login')
})

app.post('/admin/cadastro', (req, res) => {
  let formato = req.files.arquivo.name.splite('.')
  var imagem = ''
  if (formato[formato.length - 1] == 'jpg') {
    imagem = new Date().getTime + '.jpg'
    req.files.arquivo.mv(__dirname + '/public/images/' + imagem)
  } else {
    fs.unlinkSync(req.files.arquivo.tempFilePath)
  }

  Posts.create({
    titulo: req.body.titulo_noticia,
    imagem: 'http://localhost:3000/public/images/' + imagem,
    categoria: 'Nenuma',
    conteudo: req.body.noticia,
    slug: req.body.slug,
    autor: 'Admin',
    views: 0
  })
  res.redirect('/admin/login')
})

app.get('/admin/deletar/:id', (req, res) => {
  Posts.deleteOne({ _id: req.params.id }).then(function () {
    res.redirect('/admin/login')
  })
})

app.get('/admin/login', (req, res) => {
  if (req.session.login == null) {
    res.render('admin-login')
  } else {
    Posts.find({})
      .sort({ _id: -1 })
      .then(posts => {
        posts = posts.map(function (val) {
          return {
            id: val.id,
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria
          }
        })
        res.render('admin-painel', { posts: posts })
      })
      .catch(err => {
        console.log(err.message)
      })
  }
})

app.listen(3000, () => {
  console.log('servidor rodadno')
})
