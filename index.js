import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient} from "mongodb";

const app = express();
app.use(cors());
app.use(json());

let db = null;
const mongoClient = new MongoClient("mongodb://localhost:27017");
const calling = mongoClient.connect();
calling.then(() => {
	db = mongoClient.db("users_data");
});
calling.catch((erro) => console.log(erro));

app.post("/participants", (req, res) => {
    //inserindo os usuarios
    const promise = db.collection("participants").insertOne(req.body);
    promise.then(() => {
        res.sendStatus(201);
    });
});

app.get("/participants", (req, res) => {
    //pegando os usuarios
    const promise = db.collection("participants").find().toArray();
    promise.then(participants => {res.send(participants);
	});
});

app.listen(5000, () => console.log(chalk.bold.green("Servidor em pé na porta 5000")));