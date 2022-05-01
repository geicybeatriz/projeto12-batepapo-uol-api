import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient} from "mongodb";
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

    try {
        const namesList = await db.collection("participants").find({}).toArray();
        console.log("nomes", namesList);
        for(let i = 0; i < namesList.length; i++){
            if(user.name === namesList[i].name){
                res.status(409).send("O usuário ja existe");
                return;
            }
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

//mensagens
app.post("/messages", (req, res) => {
    const {to, text, type} = req.body;
    const {user} = req.headers;
    res.send("ok");
    
})
app.get("/messages", (req, res) => {
    res.send("ok");
    
})



app.listen(5000, () => console.log(chalk.bold.green("Servidor em pé na porta 5000")));