import express from 'express';
import path from 'path';
import serverRoutes from './routes/servers.js';

const __dirname = path.resolve();
const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'static')));
app.use(express.static(path.resolve(__dirname, 'output')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(serverRoutes);




app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server has been started on port ${PORT}...`);
})