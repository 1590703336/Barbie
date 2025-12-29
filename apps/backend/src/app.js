import express from "express";
import { PORT } from "./config/env.js";
import userRouter from "./modules/user/user.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import subscriptionRouter from "./modules/subscription/subscription.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddlewares from "./middlewares/error.middlewares.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middlewares/arcjet.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())

//app.use(arcjetMiddleware);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

app.use(errorMiddlewares);

app.get('/', (req, res) => {
    res.send('Welcome to the app!');
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${ PORT }`);

    await connectToDatabase()
});

export default app;
