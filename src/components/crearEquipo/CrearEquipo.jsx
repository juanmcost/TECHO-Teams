import React, { useState, useEffect } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import "./CrearEquipo";
import Button from "@mui/material/Button";
import { CustomHook } from "../../hooks/CustomHook";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import getToken from "../../utils/getToken";
import { useSelector } from "react-redux";

const listaAreas = [
  "",
  "Voluntariado",
  "Comunicaciones",
  "Desarrollo de Fondos",
  "Gestión Comunitaria",
  "Administración y Finanzas",
  "Legal",
  "Investigación",
  "Regional/Generalista",
  "Vivienda y Habitat",
];

export function CrearEquipo() {
  const navigate = useNavigate();
  const [paises, setPaises] = useState([]);
  const pais = CustomHook("");
  const nombre = CustomHook("");
  const [sedes, setSedes] = useState([]);
  const sede = CustomHook("");
  const cantidad = CustomHook("");
  const [comunidades, setComunidades] = useState([]);
  const comunidad = CustomHook("");
  const descripcion = CustomHook("");
  const areas = CustomHook("");
  const [categoria, setCategoria] = useState("");
  const loggedUser = useSelector((state) => state.usuario);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/regiones/paises")
      .then((res) => setPaises(res.data))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/sedes")
      .then((res) =>
        setSedes(
          res.data.filter(
            (sedesPais) => sedesPais.id_pais.toString() === pais.value
          )
        )
      )
      .catch((err) => console.log(err));
  }, [pais.value]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/comunidades", {
        headers: { Authorization: getToken() },
      })
      .then((res) => {
        let comunidadArr = res.data.text;
        //.slice(0, res.data.length - 2);
        console.log(comunidadArr);
        return setComunidades(
          comunidadArr.filter(
            (comunidadesPais) => comunidadesPais.id_pais === pais.value
          )
        );
      })
      .catch((err) => console.log(err));
  }, [pais.value]);

  let toggleTerrit = () => {
    var element = document.getElementById("Territo");
    element.style.pointerEvents = "none";
  };

  let toggleTerrito = () => {
    var element = document.getElementById("Territo");
    element.style.pointerEvents = "auto";
  };

  const successAlert = () => {
    swal({
      title: "Equipo creado con exito!",
      text: "El equipo fue incorporado a la plataforma",
      icon: "success",
      timer: "5000",
    });
  };

  const errorAlert = (
    title = "Error!",
    text = "Complete todos los campos requeridos"
  ) => {
    swal({
      title,
      text,
      icon: "error",
      timer: "5000",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!pais.value || !categoria)
      errorAlert("Error!", "Complete todos los campos requeridos");
    if (!parseInt(cantidad.value))
      errorAlert("Error!", "Complete correctamente la cantidad de miembros");
    else
      axios
        .post(
          `http://localhost:3001/api/equipos/`,
          {
            nombre: nombre.value,
            cantMiembros: parseInt(cantidad.value),
            activo: true,
            detalles: descripcion.value,
            paisId: parseInt(pais.value),
            sedeId: sede.value ? parseInt(sede.value) : 0,
            // falta la comunidad/barrio, hay que arreglar el endpoint, si categoria = oficina, va vacio
            categoria: categoria,
            area: areas.value,
          },
          {
            headers: {
              Authorization: loggedUser.token,
              idPersona: loggedUser.idPersona,
            },
          }
        )
        .then((res) => {
          successAlert();
          return res.data;
        })
        .then((equipo) => navigate(`/miEquipo/${equipo.id}`));
  };

  return (
    <div>
      <div id="register">
        <h2 className="TitleRegister">CREACIÓN DE EQUIPOS</h2>
        <form onSubmit={handleSubmit}>
          <div className="contenedor-formulario">
            <label htmlFor="selector" className="label">
              <p>NOMBRE DEL EQUIPO</p>
              <TextField
                className="text-field"
                size="small"
                type="text"
                name="nombre"
                {...nombre}
                required
              />
            </label>
            <label htmlFor="selector" className="label">
              <p>DESCRIPCION</p>
              <textarea
                style={{ resize: "none" }}
                className="text-field"
                size="small"
                type="text"
                name="nombres"
                rows="4"
                {...descripcion}
                required
              />
            </label>
            <label htmlFor="selector" className="label">
              <p>CANTIDAD IDEAL DE MIEMBROS</p>
              <TextField
                className="text-field"
                size="small"
                type="text"
                name="nombres"
                {...cantidad}
                required
              />
            </label>
            <label htmlFor="selector" className="label">
              <p>PAÍS</p>
              <select {...pais} className="form-select">
                <option></option>
                {paises.map((pais) => (
                  <option key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="selector" className="label" required>
              <p>CATEGORIA </p>
              <div className="radio" onClick={toggleTerrit}>
                <label>
                  <input
                    id="radio-button"
                    name="categoria"
                    type="radio"
                    value={categoria}
                    onChange={() => setCategoria("Oficina")}
                  />
                  Oficina
                </label>
              </div>

              <div className="radio" onClick={toggleTerrito}>
                <label>
                  <input
                    id="radio-button"
                    name="categoria"
                    type="radio"
                    value={categoria}
                    onChange={() => setCategoria("Territorio")}
                  />
                  Territorio
                </label>
              </div>
            </label>
            <label htmlFor="selector" className="label">
              <p>SEDE</p>
              <select {...sede} className="form-select">
                <option></option>
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="selector" className="label" id="Territo">
              <p>BARRIO (solo si la categoria es "Territorio")</p>
              <select {...comunidad} className="form-select">
                {comunidades.map((comunidad) => (
                  <option key={comunidad.id} value={comunidad.id}>
                    {comunidad.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="selector" className="label">
              <p>ÁREA</p>
              <select {...areas} className="form-select">
                {listaAreas.map((area, i) => (
                  <option key={i} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "50px",
            }}
          >
            <Link style={{ textDecoration: "none" }} to="/">
              <Button variant="text">VOLVER</Button>
            </Link>
            <Button
              id="ingresar"
              size="medium"
              variant="outlined"
              type="submit"
            >
              CREAR EQUIPO
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
