import app from "./app.js";
import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${ PORT }`);

    await connectToDatabase()
});