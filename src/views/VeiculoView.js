class VeiculoView {
  static sucesso(mensagem, dados, statusHttp = 200) {
    return {status: "Sucesso", codigoHttp: statusHttp, mensagem: mensagem, dados: dados}
}
  static erro(mensagem, dados, statusHttp = 400) {
    return {status: "Erro", codigoHttp: statusHttp >=500 ? "Erro Crítico do Servidor (5xx)" : "Erro do Cliente (4xx)", mensagem: mensagem};
  }
}

module.exports = VeiculoView;