class Rel {
  constructor(Type, Poids, Tid, Content) {
    this.type = Type;
    this.poids = Poids;
    this.tid = Tid;
    this.content = Content;
    this.toJSON =
      "{" +
      '"type":"' +
      this.type +
      '",' +
      '"poids":' +
      this.poids +
      "," +
      '"tid":' +
      this.tid +
      "," +
      '"content":"' +
      this.content +
      '"' +
      "}";
  }
}

module.exports = {
  rel: Rel,
};
