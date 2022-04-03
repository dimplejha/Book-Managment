const jwt = require("jsonwebtoken")
const bookModel = require("../models/bookModel")

const authentication = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"];
        if (!token) return res.status(400).send({ status: false, msg: "login is required" })
        let decodedtoken = jwt.verify(token, "Secret-Key")
        if (!decodedtoken) return res.status(401).send({ status: false, msg: "token is invalid" })

        next()
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ msg: error.message })
    }
}


const authorisation = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"]
        let decodedToken = jwt.verify(token, "Secret-Key")
        let bookId = req.params.bookId
        if (bookId) {
            let bookFound = await bookModel.findById(bookId).select({ userId: 1 })
            userId = bookFound.userId
            
            if (userId != decodedToken.userId) {
                
                return res.status(403).send({ status: false, message: "user not authorised" })
            }
        }
        else {
            let userId = req.body.userId
            if (decodedToken.userId != userId) {
                return res.status(403).send({ status: false, message: "user not authorised to perform task" })
            }
        }
        next()
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ msg: error.message })
    }
}



module.exports.authentication = authentication;
module.exports.authorisation = authorisation;