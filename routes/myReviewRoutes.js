const express = require("express")
const xss = require("xss")
const data = require("../data")
const authValidations = require("../utils/authValidations")

const router = express.Router()
const bookInfoData = data.bookInfoData

router
    .route("/")
    .get(async (req, res) => {
        if(!req.session.user){
            return res.redirect("/auth/login")
        }

        let errors = {}
        let userId = xss(req.session.user._id).trim()
        let username = xss(req.session.user.username)
        try {
            authValidations.isValidId(userId, "user id", errors)
        } catch(exception) {
            return res.redirect("/auth/login")
        }

        try {
            let reviewsWithBookInformation = await bookInfoData.getReviewsFromUsername(username)
            return res.status(200).render("myReviews", {
                data: reviewsWithBookInformation,
                title: "My Reviews",
                showNav: true
            })
        } catch(exception) {
            return res.status(200).render("myReviews", {
                title: "My Reviews",
                data: [],
                showNav: true
            })
        }
        
    })

router
    .route("/:reviewId")
    .delete(async (req, res) => {
        let errors = {}
        
        if(!req.session.user) {
            errors.other = "Invalid operation"
            return res.status(400).json(errors)
        }
        reviewId = xss(req.params.reviewId).trim()
        username = xss(req.session.user.username).trim().toLowerCase()
        
        try {
            authValidations.isValidId(reviewId, "review id", errors)
        } catch(exception) {
            return res.status(400).json(exception)
        }

        let reviewFromDB = null
        try {
            reviewFromDB = await bookInfoData.getReviewById(reviewId)
            if(reviewFromDB === null) {
                errors.other = "No reviews found with this ID."
                return res.status(400).json(errors)
            }
        } catch(exception) {
            return res.status(400).json(errors)
        }

        if(reviewFromDB.userThatPostedReview !== username) {
            errors.other = "Trying to delete someone elses review."
            return res.status(400).json(errors)
        }

        try {
            let data = await bookInfoData.deleteReview(reviewId, username)
            return res.status(200).json({})
        } catch(exception) {
            return res.status(400).json(exception)
        }
    })
    .put(async (req, res) => {
        let errors = {}
        
        if(!req.session.user) {
            errors.other = "Invalid operation"
            return res.status(400).json(errors)
        }
        reviewId = xss(req.params.reviewId).trim()
        username = xss(req.session.user.username).trim().toLowerCase()
        reviewMessage = xss(req.body.message).trim()

        
        try {
            authValidations.isValidId(reviewId, "review id", errors)
        } catch(exception) {
            return res.status(400).json(exception)
        }

        try {
            authValidations.isValidReview(reviewMessage, errors)
        } catch(exception) {
            return res.status(400).json(exception)
        }

        let reviewFromDB = null
        try {
            reviewFromDB = await bookInfoData.getReviewById(reviewId)
            if(reviewFromDB === null) {
                errors.other = "No reviews found with this ID."
                return res.status(400).json(errors)
            }
        } catch(exception) {
            return res.status(400).json(errors)
        }

        if(reviewFromDB.userThatPostedReview !== username) {
            errors.other = "Trying to update someone elses review."
            return res.status(400).json(errors)
        }

        try {
            let updatedReview = await bookInfoData.updateReview(reviewId, reviewMessage, username)
            return res.status(200).json()
        } catch(exception) {
            return res.status(400).json(exception)
        } 
    })
module.exports = router