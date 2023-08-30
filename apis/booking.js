const express=require('express')
const expressAsyncHandler = require('express-async-handler')

const bookApp=express.Router()

bookApp.use(express.json())

bookApp.get('/get-empty-slots',expressAsyncHandler(async(req,res)=>{


    const bookingCollection=req.app.get('bookingCollection')
    const blockeddates=req.app.get('blockeddates')
    const isBlocked=(await blockeddates.aggregate( [
        { $match: {date:req.query.date} },
        { $limit: 1 }

      ] ).toArray())[0]
    // const isBlocked=await blockeddates.findOne({date:req.query.date})
    if(isBlocked!=null){
        res.send({message:'No Slot Available'})
        return
    }
    // day-month-year
    const result=(await bookingCollection.aggregate( [
        { $match: {date:req.query.date} },
        { $limit: 1 }

      ] ).toArray())[0]
    // const result=await bookingCollection.findOne({date:req.query.date})
    if (result==null){
        res.send({"message":'empty slots are',payload:[null,null,null,null,null,null]})
    }
    else{
        res.send({"message":'empty slots are',payload:result.booking})
    }
}))


bookApp.post('/book-slot',expressAsyncHandler(async(req,res)=>{

    // date
    // slot timing index
    // user email 

    const body=req.body
    const blockeddates=req.app.get('blockeddates')
    const isBlocked=(await blockeddates.aggregate( [
        { $match: {date:req.body.date} },
        { $limit: 1 }

      ] ).toArray())[0]
    // const isBlocked=await blockeddates.findOne({date:req.body.date})
    if(isBlocked!=null){
        res.send({message:'No Slot Available'})
        return
    }
    const bookingCollection=req.app.get('bookingCollection')
    const userCollection=req.app.get('userCollection')
    let slotDetails=(await bookingCollection.aggregate( [
        { $match: {date:req.body.date }},
        {$limit:1}

      ] ).toArray())[0]
    // let slotDetails=await bookingCollection.findOne({date:body.date})
    let isNew=false
    if(slotDetails==null){
        isNew=true
        slotDetails={}
        slotDetails.booking=[null,null,null,null,null,null]
    }
    console.log(slotDetails)
    if( slotDetails.booking[body.slotIdx]==null){
        let newSlots=slotDetails.booking
        newSlots[body.slotIdx]=body.email
        if(isNew){
            await bookingCollection.insertOne({date:body.date,booking:newSlots})
        }
        else{
            await bookingCollection.updateOne({date:body.date},{$set:{booking:newSlots}})
        }
        await userCollection.updateOne({email:body.email},{$push:{booking:[body.date,body.slotIdx]}})
        let isBlocked=true
        for(var i=0;i<6;i++){
            if(newSlots[i]==null){
                isBlocked=false
                break;
            }
        }
        if(isBlocked){
            await blockeddates.insertOne({date:body.date})
        }
        res.send({message:"booking confirm"})
    }
    else{
        res.send({message:"booking unsuccessful"})
    }

}))

bookApp.post('/cancel-booking',expressAsyncHandler(async(req,res)=>{


      // date
    // slot timing index
    // user email 
    const body=req.body
    const bookingCollection=req.app.get('bookingCollection')
    const blockeddates=req.app.get('blockeddates')
    const userCollection=req.app.get('userCollection')
    const isBlocked=(await blockeddates.aggregate( [
        { $match: {date:req.body.date} },
        { $limit: 1 }

      ] ).toArray())[0]
    // const isBlocked=await blockeddates.findOne({date:req.body.date})
    if(isBlocked!=null){
        await blockeddates.deleteOne({date:body.date})
    }
    let slotDetails=(await bookingCollection.aggregate( [
        { $match: {date:req.body.date} },
        { $limit: 1 }

      ] ).toArray())[0]
    // let slotDetails=await bookingCollection.findOne({date:body.date})
    console.log("slotDetials",slotDetails)
    console.log(body)
    slotDetails.booking[body.slotIdx]=null
    await bookingCollection.updateOne({date:body.date},{$set:{booking:slotDetails.booking}})
    let userDetails=(await userCollection.aggregate( [
        { $match: {email:body.email} },
        { $limit: 1 }

      ] ).toArray())[0]
    // let userDetails=await userCollection.findOne({email:body.email})
    let userIdx=-1
    for(var i=0;i<userDetails.booking.length;i++){
        if (userDetails.booking[i][0]==body.date){
            userIdx=i;
            break
        }
    }
    userDetails.booking.splice(userIdx,1)
    await userCollection.updateOne({email:body.email},{$set:{booking:userDetails.booking}})
res.send({message:"booking cancelled"})


}))
bookApp.post('/my-bookings',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('userCollection')
    let {booking}=(await userCollection.aggregate( [
        { $match: {email:req.body.email} },
        { $limit: 1 }

      ] ).toArray())[0]
    // let {booking}=await userCollection.findOne({email:req.body.email})
    res.send({booking})
}))


module.exports=bookApp