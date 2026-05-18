const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
dotenv.config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

// 
// 

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function server() {
    try {
        await client.connect();
        
        const db = client.db("SportNest-DB");
        const sportsCollection = db.collection("sports")

        // All Sports Routes
        app.get('/sports', async(req, res) => {
            const result = await sportsCollection.find().toArray();
            res.send(result)
        })

        app.get('/sports/:id', async(req, res) => {
            const id = req.params.id;
            const result = await sportsCollection.findOne({_id: new ObjectId(id)});
            res.send(result)
        })

        app.get('/featured', async(req, res) => {
            const result = await sportsCollection.find().skip(4).limit(6).toArray();
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
server().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
