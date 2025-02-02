 const express = require("express");

 const PORT = 3000;
 const app =  express();

 app.use(express.static('./public'))
 app.use(express.json())

 const userStore={}
 app.post('/register',(req, res)=>{
    const {username, password} = req.body;
    const id = `${Date.now()}`

    const user={
        id,
        username,
        password
    }

    userStore[id]=user

    return res.json({id})
 })

 app.listen(PORT,()=>console.log("Server started on 3000"))