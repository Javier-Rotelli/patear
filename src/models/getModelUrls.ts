export default function getModelUrls() {
  const modelUrls: { [key: string]: string } = {
    cancha: "models/cancha/cancha.glb",
  };

  // generate a list of player models
  for (const gender of ["male", "female"]) {
    for (const variant of ["a", "b", "c", "d", "e", "f"]) {
      modelUrls[`jugador${gender === "male" ? "M" : "F"}${variant}`] =
        `models/players/character-${gender}-${variant}.glb`;
    }
  }
  return modelUrls;
}
