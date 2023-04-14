const fs = require('fs')
const sauceModel = require('../models/sauceModel')

exports.getAllSauces = (req, res, next) => {
    sauceModel.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}))
}

exports.getOneSauce = (req, res, next) => {
    sauceModel.findOne({ _id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(400).json({error}))
}

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new sauceModel({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });
  
    sauce.save()
    .then(() => { res.status(201).json({message: 'Sauce enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
 };

 exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete sauceObject._userId;
    sauceModel.findOne({_id: req.params.id})
        .then((object) => {
            if (object.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                if(req.file) {
                    const filename = object.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${filename}`, () => {})
                }
                sauceModel.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };
 exports.deleteSauce = (req, res, next) => {
    sauceModel.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    sauce.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Sauce supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };

 exports.likeUser = (req, res, next) => {

    let userIdentifiant = req.body.userId    
    let likeStatus = req.body.like
        if(likeStatus === 1){
            sauceModel.updateOne({ _id: req.params.id},{ $inc:{likes:+1}, $push:{ usersLiked: userIdentifiant }})
            .then(() => { res.status(201).json({message: 'Sauce like +1 !'})})
            .catch(error => res.status(400).json(error))
        }
        if(likeStatus === -1){
            sauceModel.updateOne({ _id: req.params.id},{ $inc:{dislikes:-1}, $push:{ usersDisliked: userIdentifiant }})
            .then(() => { res.status(201).json({message: 'Sauce dislike +1 !'})})
            .catch(error => res.status(400).json(error))
        }
        sauceModel.findOne({_id: req.params.id })
        .then((objet) => {
            if (likeStatus === 0 && objet.usersLiked.includes(userIdentifiant)) {
                sauceModel.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { usersLiked: userIdentifiant } })
                    .then(() => {res.status(201).json({ message: 'Like annulé' })})
                    .catch((error) => res.status(400).json(error));
            } else if (likeStatus === 0 && objet.usersDisliked.includes(userIdentifiant)) {
                sauceModel.updateOne({ _id: req.params.id }, { $inc: { dislikes: +1 }, $pull: { usersDisliked: userIdentifiant } })
                    .then(() => {res.status(201).json({ message: 'Dislike annulé' })})
                    .catch((error) => res.status(400).json(error));
            }
        }
        )
        .catch((error) => res.status(404).json(error));

        }

