const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport')
const path = require('path');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');

//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'Tietoturva',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(flash())


const initializePassport = require('./passport-config')
initializePassport(passport, getUserByUsername, getUserById)

let users = [{
  id: 1,
  username: 'aaa@com',
  password: '$2b$10$eUSXuwdr7J8hIypBiEDFrenAnmLRld/VDW1fYyzZJ6neePmzVoihm'
},{
  id: 2,
  username: 'user6@mail.com',
  password: '$2b$10$IYlVZcbfj8xRCZPbrHTYwOypBLQE1tC52ImUXRGN0GsNFsgeEDPM.'
}];
let posts = ["Hardcoded post here!"];
let register_successful = ""

//Get routes
app.get("/", checkAuthenticated ,(req, res) => {
  const helloMessage = "You are authenticated, Welcome "+req.user.username
  res.render('home', {user: helloMessage, allposts: posts});
  
});
app.get("/register", (req, res) => {
  res.render('register');
});
app.get('/login', (req, res) => {
  const errors = req.flash().error || [];
  console.log("Flash error messages "+errors)
  res.render('login', {errors,register_successful});
});
app.get('/api/todos/list', (req, res) => {
    res.send(posts);
});
app.get('/api/secret', checkAuthenticated,(req, res) => {
    console.log(req.user.username)
    res.send("Secret");
});

//Post routes
app.post("/login", checkNotAuthenticated,
  passport.authenticate('local', { failureMessage: "true", successRedirect: '/',failureRedirect: '/login', failureFlash: true }),
  function(req, res,) {
    register_successful = ""
    res.status(200).send("SUCCESS")
    //res.redirect(200, '/')
  });

app.post('/register',body('password').isStrongPassword(), checkNotAuthenticated,(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('message: "Password is not strong enough"') //Returned if password does not meet requirements. 
  }
  let found = false;
  users.forEach(user => {
      if (Object.values(user)[1] == req.body.username) {
          found = true;
          res.status(400).send("Username in use");
      }
  });
  if (found == false) {
  let index = users.length + 1;
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) { //From bcrypt
      let user = { id:index ,username: req.body.username, password: hash };
      users.push(user);
      console.log(user);
      register_successful = "Registration Successful"
      setTimeout(() => { register_successful =""; }, 5000);
      res.statusCode = 302;
      res.setHeader("Location", "/login");
      //res.redirect("/login");
      res.end();
      //
  })}
});

app.post('/add-item',checkAuthenticated,(req, res) => {
  posts.push(req.body.item);
  
  res.redirect('/')
});

app.post('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post('/api/todos',checkAuthenticated,(req, res) => {
    let todo = getTodoById(req.user.id);
    if (todo === undefined){
        let newTodos = { id:req.user.id ,todos:[req.body.todo]};
        posts.push(newTodos);
    }else{todo.todos.push(req.body.todo);}
    todo = getTodoById(req.user.id);
    res.send(todo);
});

//Functions, some function were from Erno Vanhala gitlab
function checkAuthenticated(req, res, next) {
    console.log("Checking authentication... "+req.isAuthenticated())
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect(401, '/login');
}


function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    return next();
}
function getUserByUsername(username) {
    return users.find(user => user.username === username);
}
function getUserById(id) {
    return users.find(user => user.id === id);
}



app.listen(port, () => {
    console.log("Server is up'n'running at http://localhost:" + port);
});