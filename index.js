import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient, ObjectId} from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import Joi from "joi";
dotenv.config();

const app = express();
app.use(cors());
app.use(json());

const participantsSchema = Joi.object({
    name: Joi.string().min(1).required()
});

const messageSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    text:Joi.string().required()
});

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect(() => {
    db = mongoClient.db("batepapo_uol_data");
})

app.post("/participants", async (req, res) => {
    const user = req.body;

    const validation = participantsSchema.validate(req.body, { abortEarly: false });
    if(validation.error){
        res.sendStatus(422);
        return;
    }
    const namesList = await db.collection("participants").find({}).toArray();
    try {
        if(namesList.find(participant => participant.name === user.name)){
            res.status(409).send("O usuário já existe!");
            return;
        } 

        await db.collection("participants").insertOne({name: user.name, lastStatus: Date.now()});
        await db.collection("messages").insertOne({
            from: user.name,
            to: 'Todos',
            text:'entra na sala...',
            type: 'status',
            time: dayjs().format("HH:mm:ss")
        })

        res.sendStatus(201);
    } catch (error) {
        console.log("Deu algum erro", error);
        res.sendStatus(500);
    }
});

app.get("/participants", async (req, res) => {
    try{
        const participantsList =  await db.collection("participants").find().toArray();
        res.send(participantsList);
    } catch (error){
        res.send("erro ao listar usuários");
    }
});

app.post("/messages", async (req, res) => {
    const {to, text, type} = req.body;
    const {user} = req.headers;
    const validMessage = {
        from: user,
        to:to,
        text: text
    };
    
    const validation = messageSchema.validate(validMessage, { abortEarly: true });
    if(validation.error){
        res.sendStatus(422);
        return;
    }
    
    if(type !== "message" && type !== "private_message"){
        res.sendStatus(422);
        return;
    }

    try{
        const namesList = await db.collection("participants").find({}).toArray();
        if(!namesList.find(participant => participant.name === user)){
            res.status(422).send("O usuário não está mais na lista de participantes");
            return;
        } 
        await db.collection("messages").insertOne({
            from: user,
            to: to,
            text: text,
            type: type,
            time: dayjs().format("HH:mm:ss")
        });
        res.sendStatus(201);
    } catch (error) {
        console.log("Deu algum erro", error);
        res.sendStatus(500);
    }
})

app.get("/messages", async (req, res) => {
    const limit = parseInt(req.query.limit);
    const {user} = req.headers;

    try{
        const messagesList =  await db.collection("messages").find().toArray();
        res.send(messagesList);
    } catch (error){
        console.log("error", error);
        res.send("erro ao listar as mensagens");
    }
})

app.post("/status", async (req, res) =>{
    const {user} = req.headers;
    try{
        const namesList = await db.collection("participants").find({}).toArray();
        if(!namesList.find(participant => participant.name === user)){
            res.status(404).send("O usuário não encontrado!");
            return;
        }
        await db.collection("participants").updateOne({name: user}, { $set: {lastStatus:Date.now()}});
		res.status(200).send("novo status");

    } catch (error){
        console.log("erro", error);
        res.sendStatus(500);
    }
})

setInterval(async () => {
    const userList = await db.collection("participants").find({}).toArray();
    for(let i = 0; i < userList.length; i++){
        if((Date.now() - parseInt(userList[i].lastStatus)) > 10000){
            await db.collection("participants").deleteOne({_id: new ObjectId(userList[i]._id)});
            await db.collection("messages").insertOne({
                from: userList[i].name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format("HH:mm:ss")
            })
        }
    }
}, 15000)

app.listen(5000, () => console.log(chalk.bold.green("Servidor em pé na porta 5000")));