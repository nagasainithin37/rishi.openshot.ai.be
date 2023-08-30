const express = require('express')
const app = express()
const authApp = require('./apis/authApp')
const expressAsyncHandler = require('express-async-handler')
const bookApp=require('./apis/booking')
const cors=require('cors')
const dotenv=require('dotenv')
const mClient = require('mongodb').MongoClient
require('dotenv').config()
var url = process.env.URL
app.use(cors())
mClient.connect(url)
.then ((client)=>{
     console.log('Connetion Successful')
     const dbobj=client.db('Openshot')
     const otpCollection = dbobj.collection('otp')
     const bookingCollection=dbobj.collection('bookings')
     const userCollection=dbobj.collection('user')
     const blockeddates=dbobj.collection('blockeddates')
     app.set('otpCollection',otpCollection)
     app.set('blockeddates',blockeddates)
     app.set('bookingCollection',bookingCollection)
     app.set('userCollection',userCollection)
})
.catch((err)=>{
    console.log("Failed to Connect"+err.message)
})
app.get("/",(req,res)=>{
    res.send("<h1>hello<h1>")
})
app.use('/auth',authApp)
app.use('/booking',bookApp)









// handling invalid paths
app.use((req,res,next)=>{
    res.send({"message":`invalid path ${req.url}`})
})

app.use((err,req,res,next)=>{
    res.send({"Error":`error is ${err.message}`})
})





app.listen(process.env.PORT,()=>{
    console.log('listening.....')
})