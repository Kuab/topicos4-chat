var Todo = require('../model/todo.js');


// LISTA OS TODOS NO BANCO
exports.list = function (req, res) {
  Todo.find(function(err, todos) {
    res.json({todos: todos});
  });
};


// ADD NOVO TODO NO BANCO
exports.add = function(req, res){
  new Todo({text: req.body.text, done: req.body.done}).save(function (err) {
     if (err){
       console.log("erro ao add: " + err);
     }else{
      res.json(req.body);
     }
  });
};

exports.archive = function(req, res){
  Todo.remove({done: req.body.done}, function(err){
    if(err){
      console.log("erro ao arquivar: " + err);
    }else{
      res.json(req.body);
    }
  });
};

exports.update = function(req, res){
  Todo.findById(req.body._id, function(err, todoFounded) {
    if(err){
      console.log('Não encontrou o todo: '  + err);
    }
    else{
      todoFounded.text = req.body.text;
      todoFounded.done = req.body.done;

      todoFounded.save(function(err){
        if(err){
          console.log("erro ao atualizar todo: " + err);
        }
      });

      res.json(req.body);
    }
  });
};