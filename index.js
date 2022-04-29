import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient} from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
dotenv.config();

const app = express();
app.use(cors());
app.use(json());

//inicializando banco de dados
let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);
const promise = mongoClient.connect();
promise.then(() => {
	db = mongoClient.db("users_data");
});
promise.catch((erro) => console.log(erro));

//participantes
app.post("/participants", (req, res) => {
    const sendUser = {...req.body, lastStatus: Date.now()};
    
    //validação   
    const participantsSchema = Joi.object({
        name: Joi.string().min(1).required()
    })
    const validation = participantsSchema.validate(req.body);
    if(validation.error){
        res.sendStatus(422);
    }

    //inserindo os usuarios
    const promise = db.collection("participants").insertOne(sendUser);
    promise.then(() => {
        res.sendStatus(201);
    });
    promise.catch((err) => console.log("Deu algum erro", err));
});

app.get("/participants", (req, res) => {
    //pegando os usuarios
    const promise = db.collection("participants").find().toArray();
    promise.then(participants => {res.send(participants);
	});
});

app.listen(5000, () => console.log(chalk.bold.green("Servidor em pé na porta 5000")));