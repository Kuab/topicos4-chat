'use strict';

var current_username;

/* Controllers */

function AppCtrl($scope, socket) {
  $scope.glued = true;
  // Socket listeners
  // ================

  socket.on('init', function (data) {
    current_username =  data.name;
    $scope.name = data.name;
    $scope.users = data.users;
  });

  socket.on('send:message', function (message) {
    var mention, me;
    mention = getMention(message.text);
    if(mention) {
      me = "active"
    } else {
      me = null;
    }
    $scope.messages.push({
      user: message.user,
      text: message.text,
      me: me
      });
  });

  socket.on('change:name', function (data) {
    changeName(data.oldName, data.newName);
    current_username = data.newName;
  });

  socket.on('user:join', function (data) {
    $scope.messages.push({
      user: 'chatroom',
      text: 'User ' + data.name + ' has joined.'
    });
    $scope.users.push(data.name);
  });

  // Mostra uma msg na sala quando um usuário sai da sala
  socket.on('user:left', function (data) {
    $scope.messages.push({
      user: 'chatroom',
      text: 'Usuário ' + data.name + ' deixou a sala.'
    });
    var i, user;
    for (i = 0; i < $scope.users.length; i++) {
      user = $scope.users[i];
      if (user === data.name) {
        $scope.users.splice(i, 1);
        break;
      }
    }
  });

  $(function(){
    $('#changeNameModal').modal('show')
  })

  // Private helpers
  // ===============

  var retrieveUsername = function() {
    var username;
    username = (localStorage.getItem("username") || false);
    if (!username) { return false; }
    return username;
  }


  var setup_member = function() {
    var username;
    username = retrieveUsername();
    console.log(username);
    if(username) {
      socket.emit('change:name', {
        name: username
      }, function (result) {
        if (!result) {
          alert('Ocorreu um erro ao mudar seu nome.');
        } else {
          
          changeName($scope.name, username);

          $scope.name = username;
          $scope.newName = '';
        }
      });

      return;
    }
    return false;
  }

  // Check if message has a mention for current user
  var getMention = function(message) {
    var text,pattern,mention;
    text = message;
    pattern = /\B\@([\w\-]+)/gim;
    mention = text.match(pattern);

    if(mention){
      mention = String(mention).split("@")[1];
      if(mention === current_username) return mention;
    }

    return false;
  }

  var changeName = function (oldName, newName, member) {
    // rename user in list of users
    var i;
    for (i = 0; i < $scope.users.length; i++) {
      if ($scope.users[i] === oldName) {
        $scope.users[i] = newName;
      }
    }

    localStorage.setItem("username",newName);
    current_username = newName;

    $scope.messages.push({
      user: 'chatroom',
      text: 'Usuário ' + oldName + ' mudou seu nome para ' + newName + '.'
    });
  }

  // Methods published to the scope
  // ==============================

  $scope.mention = function (name) {
      $scope.message = '@' + name + ' ';
      $('.input-message').focus()
  };

  $scope.changeName = function () {
    socket.emit('change:name', {
      name: $scope.newName
    }, function (result) {
      if (!result) {
        alert('Ocorreu um erro ao mudar seu nome.');
      } else {
        
        changeName($scope.name, $scope.newName);

        $scope.name = $scope.newName;
        $scope.newName = '';
        $('#changeNameModal').modal('hide')
      }
    });
  };

  $scope.messages = [];

  $scope.sendMessage = function () {
    socket.emit('send:message', {
      message: $scope.message
    });

    // add the message to our model locally
    $scope.messages.push({
      user: $scope.name,
      text: $scope.message
    });

    // clear message box
    $scope.message = '';
  };
}


function TodoCtrl($scope, $http, socket) {

  $scope.todos = [];

  socket.on('todo:change', function(){
    listTodos();
  });

  //metodo privado
  var listTodos = function (){
     $http({method: 'GET', url: '/api/list'}).
      success(function(data, status, headers, config) {
          $scope.todos = data.todos;
      });
  }

  //lista todos na inicialização
  listTodos();

  //add novo registro
  $scope.addTodo = function() {
    if($scope.todoText.trim() != ''){
      $http.post('/api/add', {
        text: $scope.todoText,
        done: false
      }).
      success(function(data, status, headers, config) {
        $scope.todoText = '';
        socket.emit('todo:change'); // informa todos usuários da mudança
        listTodos(); //atualiza a lista de tarefas na tela
      });
    }
  };
 
 //conta o total não realizado
  $scope.remaining = function() {
    var count = 0;
    angular.forEach($scope.todos, function(todo) {
      count += todo.done ? 0 : 1;
    });
    return count;
  };
 
 //arquiva os já executados
  $scope.archive = function() {
    $http.post('/api/archive', {
      done: true
    }).
    success(function(data, status, headers, config) {
      socket.emit('todo:change'); // informa todos usuários da mudança
      listTodos(); //atualiza a lista de tarefas na tela
    });
  };

  //atualiza o registro
  $scope.changeTodo = function(todo){
      $http({ method: 'PUT', 
              url: '/api/update/' + todo._id,
              data: todo
            }).
        success(function(data, status, headers, config) {
        socket.emit('todo:change'); // informa todos usuários da mudança
      });
  };
}
