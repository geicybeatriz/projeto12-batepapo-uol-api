import express from "express";
import chalk from "chalk";

const app = express();

app.listen(5000, () => console.log(chalk.bold.green("Servidor em pé na porta 5000")));