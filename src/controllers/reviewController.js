const reviewModel = require("../models/reviewModel");
const bookModel = require("../models/bookModel")


const isValid = function (value) {
    if (typeof (value) === undefined || typeof (value) === null) { return false }
    if (typeof (value) === "string" && (value).length > 0) { return true }
    if (typeof (value) === "number" && (value).toString().length > 0) { return true }
}



const isValidObjectId = function (objectId) {
    return /^[0-9a-fA-F]{24}$/.test(objectId)
}

const createReview = async function (req, res) {
    try {
        let data = req.body;
        let id = req.params.bookId;
        const { bookId, rating } = data

        if (!isValidObjectId(id)) { return res.status(400).send({ status: false, message: 'please provide a valid id' }) }

        if (id != bookId) { return res.status(400).send({ status: false, message: 'Please provide a valid book Id' }) }

        let books = await bookModel.findById(id);
        if (!books) { return res.status(404).send({ status: false, message: 'No book found with this id, please check yout input' }) }

        let is_Deleted = books.isDeleted;
        if (is_Deleted == true) { return res.status(404).send({ status: false, message: 'Book is deleted, unable to find book' }) }

        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No input provided' }) }

        if (!isValid(bookId)) { return res.status(400).send({ status: false, message: 'Book Id is required' }) }

        if (!isValidObjectId(bookId)) { return res.status(400).send({ status: false, message: 'Please provide a valid Book Id' }) }

        let Books = await bookModel.findById(bookId);
        if (!Books) { return res.status(400).send({ status: false, message: 'there is no such id in database, please provide a valid book Id' }) }

        if (!isValid(rating)) { return res.status(400).send({ status: false, message: "Rating is required" }) }

        if (rating < 1 || rating > 5) { return res.status(400).send({ status: false, message: "Rating must be minimum 1 and maximum 5" }) }

        data.reviewedAt = new Date();

        const updatedBook = await bookModel.findOneAndUpdate({ _id: id }, { $inc: { reviews: +1 } }, { new: true })

        const reviews = await reviewModel.create(data);


        return res.status(201).send({ status: true, message: 'success', data: { ...updatedBook.toObject(), reviewsData: reviews } })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const updateReview = async function (req, res) {
    try {
        let data = req.body
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId
        if (!isValid(bookId)) {
            return res.status(404).send({ messege: "Please provide  bookId" })
        }
        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: 'You Are Providing Invalid bookId' });
            return;
        }
        if (!isValid(reviewId)) {
            return res.status(404).send({ message: "Please provide reviewId " })
        }
        if (!isValidObjectId(reviewId)) {
            res.status(400).send({ status: false, message: 'You Are Providing Invalid reviewId' });
            return;
        }
        let bookFound = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!bookFound) {
            return res.status(404).send({ message: "No book found" })
        }
        let checkReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!checkReview) {
            return res.status(404).send({ status: false, message: "The Review Doesn't Exist" })
        }
        if (bookFound && checkReview) {
            if (checkReview.bookId == bookId) {
                if (Object.keys(data).length == 0) {
                    return res.status(400).send({ message: "Please Provide The Required data" })
                }

                const { reviewedBy, review, rating } = data
                if (reviewedBy) {
                    if (!isValid(reviewedBy)) {
                        return res.status(404).send({ message: "Please provide The reviewer's name" })
                    }
                }
                if (review) {
                    if (!isValid(review)) {
                        return res.status(404).send({ message: "Please Provide Your Review" })
                    }
                }
                if (rating) {
                    if (!isValid(rating)) {
                        return res.status(404).send({ message: "Please Enter Rating" })
                    }
                    if (rating < 1 || rating > 5) {
                        return res.status(400).send({ status: false, message: "Rating Value Should Be In Between 1 to 5" })
                    }
                }

                const updatedReview = await reviewModel.findOneAndUpdate({ _id: reviewId }, { ...data }, { new: true }).select({ __v: 0 })
                return res.status(200).send({ status: true, message: 'Review updated', data: updatedReview });
            }
            else {
                return res.status(400).send({ status: false, message: "You Are Not Authorized To Update The review" })
            }
        } else {
            return res.status(400).send({ status: false, message: "can't find book to review " })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


const deleteReview = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId

        if (Object.keys(bookId) == 0) { return res.status(400).send({ status: false, message: "Please provide book Id" })}

        if (Object.keys(reviewId) == 0) { return res.status(400).send({ status: false, message: "please provide review Id" })}

        if (!isValidObjectId(bookId)) { return res.status(400).send({ status: false, message: 'please provide a valid Book id' }) }

        if (!isValidObjectId(reviewId)) { return res.status(400).send({ status: false, message: 'please provide a valid Review id' }) }

        const findBook = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!findBook) { return res.status(404).send({ status: false, message: "No Book Is Present with this id" })}

        const findReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!findReview) { return res.status(404).send({ status: false, message: "No Review Is Present with this id" })}

        if (findBook.isDeleted == true) { return res.status(400).send({ status: false, message: "Book has already been deleted" }) }

        if (findReview.isDeleted == true) { return res.status(400).send({ status: false, message: "Review has already been deleted" }) }

        const deleteReviewDetails = await reviewModel.findOneAndUpdate({ _id: reviewId }, { isDeleted: true, deletedAt: new Date() }, { new: true })

        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: -1 } })

        return res.status(200).send({ status: true, message: "Review deleted successfully.", data: deleteReviewDetails })



    }
    catch (error) {
        console.log(err)
        res.status(500).send({ status: false, message: error.message })
    }
}



module.exports.createReview = createReview;
module.exports.updateReview = updateReview;
module.exports.deleteReview = deleteReview;


