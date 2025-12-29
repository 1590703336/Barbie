import aj from '../config/arcjet.config.js';

const arcjetMiddleware = async (req, res, next) => {
    try {
        const decision = await aj.protect(req, { requested: 1 });
        if(decision.isDenied){
            if(decision.reason.isRateLimit()) return res.status(429).json({ error: 'Rate limited exceeded' });
            if(decision.reason.isBot()) return res.status(403).json({ error: 'Bot detected' });
            if(decision.reason.isShield()) return res.status(403).json({ error: 'Shielded' });
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    } catch (error) {
        console.error("error in arcjet middleware: ", error);
        next(error);
    }
}

export default arcjetMiddleware;