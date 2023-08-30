const express = require('express')
const expressAsyncHandler = require('express-async-handler')
const dotenv=require('dotenv')
const authApp = express.Router()
authApp.use(express.json())
dotenv.config({
    path:"./config.env"
})
// var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
// const sendMailToUser=require('./mail')
const nodemailer=require('nodemailer');


const transpoter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

authApp.get('/dummy',expressAsyncHandler(async(req,res)=>{
    console.log("in dummy")
    const bookingCollection=req.app.get('bookingCollection')
    const resul=(await bookingCollection.aggregate( [
        { $match: { date:'30-8-2023' } },
        { $limit: 1 }

      ] ).toArray())[0]
      
    res.send({message:resul})
}))

authApp.post('/login',expressAsyncHandler(async(req,res)=>{

    const otpCollection=req.app.get('otpCollection')
    const isOtpPresent=(await otpCollection.aggregate( [
        { $match: { email:req.body.email} },
        { $limit: 1 }

      ] ).toArray())[0]
    // const isOtpPresent=await otpCollection.findOne({email:req.body.email})
    if (isOtpPresent==null){
        const otp=Math.floor(Math.random()*1000000)
        await otpCollection.insertOne({email:req.body.email,otp})
        const options={
            from:process.env.EMAIL,
            to:req.body.email,
            subject:"OTP",
            text:`Your One Time Password is ${otp}`
        };
        transpoter.sendMail(options,function(err,info){
            if(err){
                console.log(err)
                res.send({"message":"Failure"})
            }
            else{
                res.send({"message":"Success"})
            }
        })
    }
    else{
        const otp=Math.floor(Math.random()*1000000)
        await otpCollection.updateOne({email:req.body.email},{$set:{"otp":otp}})
        const options={
            from:process.env.EMAIL,
            to:req.body.email,
            subject:"OTP",
            text:`Your One Time Password is ${otp}`
        };
        transpoter.sendMail(options,function(err,info){
            if(err){
                console.log(err)
                res.send({"message":"Failure"})
            }
            else{
                res.send({"message":"Success"})
            }
        })
    }

}))



authApp.post('/verify-otp',expressAsyncHandler(async(req,res)=>{

    const otpCollection=req.app.get('otpCollection')
    const isOtpPresent=(await otpCollection.aggregate( [
        { $match: { email:req.body.email} },
        { $limit: 1 }

      ] ).toArray())[0]
    // const isOtpPresent=await otpCollection.findOne({email:req.body.email})
    const userCollection=req.app.get('userCollection')
    if (isOtpPresent==null){
        res.send({"message":"No OTP"})
    }
    else{
        if(isOtpPresent.otp==req.body.otp){
            let isNewuser=(await userCollection.aggregate( [
                { $match: {email:req.body.email} },
                { $limit: 1 }
        
              ] ).toArray())[0]
            // let isNewuser=await userCollection.findOne({email:req.body.email})
            console.log(isNewuser)
            if(isNewuser==null){
                await userCollection.insertOne({email:req.body.email,booking:[]})
                isNewuser={email:req.body.email,booking:[]}
            }
            const token=jwt.sign({email:req.body.email},'bgvidfh940o54',{expiresIn:"2d"})
            await otpCollection.deleteOne({email:req.body.email})
            res.send({token,isNewuser})
        }
        else{
            res.send({"message":"Wrong OTP "})
        }
    }






}))

module.exports=authApp