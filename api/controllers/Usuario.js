const { Usuario, Evento, UsuarioEnEquipo, Equipo } = require("../models");
const generateAxios = require("../utils/generateAxios");
const superagent = require("superagent");
const Sequelize = require("sequelize");
const multer = require("multer");
let fs = require("fs-extra");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/perfil");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

class UsuarioController {
  static async getUsuarios(req, res) {
    Usuario.findAll(/* {offset: 4, limit: 6} */) //<-- not working
      .then(async (usersList) => {
        let usersInfo = [];
        let i = 0;
        usersList = usersList.slice(req.headers.offset, req.headers.limit);
        const server = generateAxios(req.headers.authorization);
        for (i; i < usersList.length; i++) {
          await server
            .get(`/personas/${usersList[i].idPersona}`)
            .then((res) => res.data)
            .then((usrInfo) =>
              usersInfo.push({ ...usersList[i].dataValues, ...usrInfo })
            );
        }
        return res.send(usersInfo);
      })
      .catch((err) => console.log(err));
  }

  static getUsuarioById(req, res) {
    const server = generateAxios(req.headers.authorization);
    server
      .get(`/personas/${req.params.id}`)
      .then((res) => res.data)
      .then((usuarioActivs) => {
        return Usuario.findOne({ where: { idPersona: req.params.id } }).then(
          (usuarioEqs) =>
            res.status(200).send({
              ...usuarioEqs.dataValues,
              ...usuarioActivs,
            })
        );
      })
      .catch((err) => res.status(500).send(err));
  }

  static getUsuarioByMail(req, res) {
    const server = generateAxios(req.headers.authorization);
    server
      .get(`/personas/mail/${req.params.mail}`)
      .then((res) => res.data[0])
      .then((usuarioActivs) => {
        return Usuario.findOne({
          where: { idPersona: usuarioActivs.idPersona },
        }).then((usuarioEqs) =>
          res.status(200).send({
            ...usuarioEqs.dataValues,
            ...usuarioActivs,
          })
        );
      })
      .catch((err) => res.status(500).send(err));
  }

  static toggleAdmin(req, res) {
    Usuario.update(
      { isAdmin: Sequelize.literal("NOT isAdmin") },
      { where: { idPersona: req.params.idPersona } }
    ).then(() => res.status(200).send("Se cambió el status de admin"));
  }

  static crearUsuario(req, res) {
    const {
      idPais,
      idProvincia,
      idLocalidad,
      password,
      password_confirmation,
      idUnidadOrganizacional,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      telefono,
      telefonoMovil,
      sexo,
      dni,
      mail,
      recibirMails,
      acepta_marketing,
      profesion,
      estudios,
      intereses,
    } = req.body;

    superagent
      .post("https://sandbox.actividades.techo.org/api/register")
      .send({
        idPais,
        idProvincia,
        idLocalidad,
        password,
        password_confirmation,
        idUnidadOrganizacional,
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento,
        telefono,
        telefonoMovil,
        sexo,
        dni,
        mail,
        recibirMails,
        acepta_marketing,
      })
      .set("X-API-Key", "foobar")
      .set("Accept", "application/json")
      .then((r) => JSON.parse(r.text))
      .then((newUser) => {
        return Usuario.create({
          idPersona: newUser.persona.idPersona,
          profesion,
          estudios,
          intereses,
          imagen: req.file && req.file.filename,
        }).then((user) => res.status(201).send(user));
      })
      .catch((err) => {
        console.log({ err });
        res.status(500).send(err);
      });
  }

  static crearUsuarioEquipos(req, res) {
    //user es el obj del estado global de usuario, desde front pasarlo en el body del axios
    const { idPersona, profesion, estudios, intereses } = req.body;
    Usuario.create(req.body)
      .then((user) => res.status(201).send(user))
      .catch((err) => res.status(401).send(err));
  }

  static loginInUsuario(req, res) {
    superagent
      .post("https://sandbox.actividades.techo.org/api/login")
      .send(req.body)
      .set("X-API-Key", "foobar")
      .set("Accept", "application/json")
      .then((r) => JSON.parse(r.text))
      .then((userActivs) => {
        return Usuario.findOne({
          where: { idPersona: userActivs.user.idPersona },
        })
          .then((user) =>
            res.status(200).send(
              !user
                ? { ...userActivs.user, token: userActivs.token }
                : !userActivs.user.email_verified_at
                ? { error: "Usuario debe validar mail" }
                : {
                    ...user.dataValues,
                    ...userActivs.user,
                    token: userActivs.token,
                  }
            )
          )
          .catch((err) => res.status(500).send(err));
      })
      .catch((err) => res.status(500).send(err));
  }

  static logoutUsuario(req, res) {
    const server = generateAxios(req.headers.authorization);
    server
      .post("/logout")
      .then((r) =>
        res.status(200).send({ success: true, mensaje: "Sesión Cerrada" })
      )
      .catch((err) => res.status(500).send({ err }));
  }

  static editarUsuario(req, res) {
    //las siguientes propiedades llegan como string
    //se convierten a su type original
    req.body.idPais = parseInt(req.body.idPais)
    req.body.idProvincia = parseInt(req.body.idProvincia)
    req.body.idLocalidad = parseInt(req.body.idLocalidad)
    req.body.recibirMails = JSON.parse(req.body.recibirMails)
    req.body.acepta_marketing = JSON.parse(req.body.acepta_marketing)
    req.body.idUnidadOrganizacional = JSON.parse(req.body.idUnidadOrganizacional)
    const {
      idPais,
      idProvincia,
      idLocalidad,
      nombres,
      apellidoPaterno,
      fechaNacimiento,
      idUnidadOrganizacional,
      telefono,
      dni,
      telefonoMovil,
      mail,
      recibirMails,
      acepta_marketing,
      profesion,
      estudios,
      intereses,
    } = req.body;

    superagent
      .post(
        `https://sandbox.actividades.techo.org/api/editPersona/${req.params.id}`
      )
      .send({
        idPais,
        idProvincia,
        idLocalidad,
        nombres,
        apellidoPaterno,
        fechaNacimiento,
        telefono,
        dni,
        telefonoMovil,
        mail,
        recibirMails,
        acepta_marketing,
        idUnidadOrganizacional,
      })
      .set("X-API-Key", "foobar")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${req.headers.authorization}`)
      .then((updatedUsr) => ({
        usuarioPromise: Usuario.update(
          { profesion, estudios, intereses, imagen: req.file && req.file.filename },
          { where: { idPersona: req.params.id } }
        ),
        updatedUsr: JSON.parse(updatedUsr.text),
      }))
      .then(({ usuarioPromise, updatedUsr }) => {
        return usuarioPromise
          .then(() => Usuario.findOne({ where: { idPersona: req.params.id } }))
          .then((personaUpd) =>
            res.status(200).send({
              ...personaUpd.dataValues,
              ...updatedUsr.persona,
              token: req.headers.authorization,
            })
          );
      })
      .catch((err) => console.log({ err }));
  }

  static changeCoordAuth(req, res) {
    Usuario.update(
      {
        isCoordinador: req.body.isCoordinador,
        sedeIdCoord: req.body.sedeIdCoord || null,
        paisIdCoord: req.body.paisIdCoord || null,
        areaCoord: req.body.areaCoord || null,
      },
      { where: { idPersona: req.params.id } }
    )
      .then(() => res.send("autoridades de coordinador actualizadas"))
      .catch((err) => console.log(err));
  }

  static getHistorial(req, res) {
    let historial = [];
    UsuarioEnEquipo.findAll({ where: { usuarioIdPersona: req.params.userId } })
      .then(async (usrEnEquipos) => {
        if (usrEnEquipos.length === 0) {
          return res.send([]);
        }
        const equiposId = usrEnEquipos.map(usrEq => usrEq.equipoId)//necesito una array solo de id's para usar con sequelize
        const findEvents = () => {
          return Evento.findAll({
            where: {
              usuarioIdPersona: req.params.userId,
              equipoId: {[Sequelize.Op.or]: equiposId},
              tipo: {[Sequelize.Op.or]: [1, -1, 2]}
            },
            order: ["createdAt"],
          });
        };
        const eventos = await findEvents();
        const equipos = await Equipo.findAll({
          where: { id: {[Sequelize.Op.or]: equiposId} }
        });

        const findEquipo = (id) => {
          for (let i = 0; i < equipos.length; i++) {
            if (equipos[i].id === id) return equipos[i]
          }
        }

        for (let i = 0; i < usrEnEquipos.length; i++) {
          const //por cada equipo tengo que saber si el equipo está activo, el nombre del equipo, las fechas de entrada y salida, y los roles
          fechasEntrada = eventos.filter(e => e.tipo === 1 && e.equipoId === usrEnEquipos[i].equipoId),
          fechasSalida = eventos.filter(e => e.tipo === -1 && e.equipoId === usrEnEquipos[i].equipoId),
          rolesEnEquipo = eventos.filter(e => e.tipo === 2 && e.equipoId === usrEnEquipos[i].equipoId)

          let historialDeEquipo = {
            entradas: fechasEntrada,
            salidas: fechasSalida,
            roles: rolesEnEquipo,
            activo: usrEnEquipos[i].activo,
            equipo: findEquipo(usrEnEquipos[i].equipoId)
          };
          historial.push(historialDeEquipo);
        }
        return res.send(historial);
      })
      .catch((err) => {
        console.log("ERROR",err)
        res.status(500).send(err)});
  }

  static getActividades(req, res) {
    const server = generateAxios(req.headers.authorization);
    server
    .get("/inscripciones")
    .then(inscripciones => inscripciones.data.inscripciones)
    .then(actividades => res.status(200).send(actividades)) //arr con actividades
    .catch(err => res.status(500).send(err));
  }

  static getEquipos(req, res) {
    UsuarioEnEquipo.findAll({
      where: {
        usuarioIdPersona: req.params.idPersona,
      },
    })
      .then(usrEquipos => res.status(200).send(usrEquipos))
      .catch(err => res.status(500).send({ err }));
  }

  static async getCanEditUser(req, res) {
    try {
      const equiposCoord = await UsuarioEnEquipo.findAll({
        where: {usuarioIdPersona: req.headers.idpersona, roleId: 1, activo: true}, //equipos que coordina el usuario logeado 
      })
      const equiposUser = await UsuarioEnEquipo.findAll({
        where: {usuarioIdPersona: req.params.idPersona, activo: true}, //equipos que coordina el usuario que quiere modificar
      })
      let answer = false;
      console.log("equipos user:", equiposUser)
      console.log("equipos coord:", equiposCoord)
      equiposUser.map(usrEquipo => {//si coordina algún equipo en el que esté el usuario, puede modificar el usuario (como pidió el cliente)
        equiposCoord.map(usrEquipoCoord => {if (usrEquipo.equipoId === usrEquipoCoord.equipoId) answer = true})
      })
      return res.send(answer)
    } 
    catch (error) {
      console.log(error);
      res.status(500).send(error)
    }
  }
}

module.exports = { UsuarioController, upload: upload.single("fotoDePerfil") };
