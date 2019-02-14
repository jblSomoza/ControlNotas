'use strict'

var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var jwt = require('../services/jwt');
var path = require('path');
var fs = require('fs');

function ejemplo(req, res) {
    res.status(200).send({
        message: 'Hola'
    });
}

function registrar(req, res){
    var user = new User();
    var params = req.body;

    if(params.usuario && params.email && params.password){
        user.nombre = params.nombre;
        user.usuario = params.usuario;
        user.email = params.email;
        user.password = params.password;
        user.rol = params.rol;

        User.find({ $or:[
            {email: user.email.toLowerCase()},
            {email: user.email.toUpperCase()},
            {usuario: user.usuario.toLowerCase()},
            {usuario: user.usuario.toUpperCase()}
        ]}).exec((err, users) =>{
            if(err)return res.status(500).send({message: 'Error en la peticion de usuario'})

            if(users && users.length >= 1){
                return res.status(500).send({message: 'El usuario ya existe en el sistema'})
            }else{
                bcrypt.hash(params.password, null, null, (err, hash)=>{
                    user.password = hash;

                    user.save((err, usuarioGuardado)=>{
                        if(err)return res.status(500).send({message: 'Error al guardar el usuario'});

                        if(usuarioGuardado){
                            res.status(200).send({user: usuarioGuardado});
                        }else{
                            res.status(404).send({message: 'no se a podido registar al usuario'})
                        }
                    })
                })
            }
        })
    }else{
        res.status(200).send({
            message: 'Rellene todos los campos necesarios'
        });
    }
}

function login(req, res) {
    var params = req.body;
    var email2 = params.email;
    var password = params.password;

    User.findOne({email: email2}, (err, user)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})

        if(user){
            bcrypt.compare(password, user.password, (err, check)=>{
                if(check){
                    if(params.getToken){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })
                    } else{
                        user.password = undefined;
                        return res.status(200).send({user})
                    }
                } else{
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'})
                }
            })
        } else{
            return res.status(404).send({message: 'El usuario no se ha podido logear'})
        }
    })

}

function editarUsuario(req, res){
    var userId = req.params.id;
    var params = req.body;

    //BORRAR LA PROPIEDAD DE PASSWORD
    delete params.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'no tiene los permisos para actualizar los datos de este usuario'})
    }
    User.findByIdAndUpdate(userId, params, {new:true}, (err, usuarioActualizado)=>{
        if(err) return res.status(500).send({message: 'error en la peticion'})

        if(!usuarioActualizado) return res.status(404).send({message: 'No se ha podido actualziar los datos del usuario'})
        
        return res.status(200).send({user: usuarioActualizado})
    })
}

module.exports = {
    ejemplo,
    registrar,
    login,
    editarUsuario
}