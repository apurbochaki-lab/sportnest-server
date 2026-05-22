const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const app = express()
dotenv.config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())


const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.NEXT_PUBLIC_CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const tokenData = req?.headers?.authorization;
    const token = tokenData?.split(" ")[1]
    console.log("Token from Backend --> ", token)

    // Validation
    if (!tokenData) {
        return res.status(401).send(
            {
                Authorization: false,
                message: "You are unauthorized user to access the data!"
            }
        )
    }
    if (!token) {
        return res.status(401).send({ message: "Unauthorized" })
    }

    // Verify Token
    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log("payload from server :", payload)
        next()
    } catch (error) {
        return res.status(401).send({ message: "Unauthorized", error })
    }


}

async function server() {
    try {
        // await client.connect();

        const db = client.db("SportNest-DB");
        const sportsCollection = db.collection("sports")
        const bookingCollection = db.collection("bookings")

        const coursesCollection = db.collection("courses")

        // All Sports Routes
        app.get('/sports',  async (req, res) => {
            const search = req.query.search;
            // console.log("Search Text : ", search)

            let result;

            // Jodi search field a text thake,
            if (search) {
                result = await sportsCollection.find({
                    $or: [
                        {
                            title: {
                                $regex: search,
                                $options: 'i'
                            }
                        },
                        {
                            category: {
                                $regex: search,
                                $options: 'i'
                            }
                        }
                    ]
                }).toArray()
            }
            else {
                // Jodi search field a kuno text na thake,
                result = await sportsCollection.find().toArray();
            }
            res.send(result)
        })



        // Test Courses data
        app.get('/courses', async (req, res) => {
            const search = req.query.search;
            // const category = req.query.category;
            console.log("search : ", search, "|",)

            let result;

            // Jodi search er moddhe data thake,
            if (search) {
                result = await coursesCollection.find({
                    $or: [
                        {
                            title: {
                                $regex: search,
                                $options: 'i'
                            }
                        },

                        {
                            category: {
                                $regex: search,
                                $options: 'i'
                            }
                        }
                    ]
                }).toArray()
            }
            else {
                result = await coursesCollection.find().toArray()
            }



            res.send(result);
        })



        app.get('/sports/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await sportsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result)
        })

        app.get('/featured', async (req, res) => {
            const result = await sportsCollection.find().skip(4).limit(6).toArray();
            res.send(result)
        })


        // Post Routes
        app.post('/sports', async (req, res) => {
            const formData = req.body;
            // console.log("Data from client : ", formData)
            const result = await sportsCollection.insertOne(formData);
            res.send(result);
        })
        // Bookings
        app.post('/bookings', verifyToken, async (req, res) => {
            const bookingData = req.body;
            // console.log(bookingData)
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result)
        })

        app.get('/bookings', async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send(result)
        })

        // My Booking Filtering by session userId
        app.get('/bookings/:userId', async (req, res) => {
            const id = req.params.userId;

            const result = await bookingCollection.find(
                { userId: id }
            ).toArray()
            res.send(result);
        })

        // Cancel Booking
        app.delete('/bookings/:bookingId', async (req, res) => {
            const id = req.params.bookingId;
            console.log("Cancel Booking : ", id)
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) })
            console.log("Deleted item : ", result)
            res.send(result)
        })


        // Manage My Facilities PATCH
        app.patch('/sports', async (req, res) => {
            const id = req.headers.id;
            const updatedData = req.body;
            console.log(id)
            console.log(updatedData)

            const result = await sportsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            )

            res.send(result)
        })
        // Manage My Facilities DELETE
        app.delete('/sports', async (req, res) => {
            const id = req.headers.id;
            console.log(id)
            const result = await sportsCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })


        // await client.db("admin").command({ ping: 1 });
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
