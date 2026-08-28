import jwt, { JwtPayload } from "jsonwebtoken";

export function generateJwt(jwtPayload:JwtPayload):string {
    const privateKey = process.env.JWT_SECRET as string
    
    const token = jwt.sign(jwtPayload , privateKey , {
        expiresIn : '30d'
    })
    return token
}