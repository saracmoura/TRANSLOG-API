const VeiculoModel = require('../models/VeiculoModel');
const VeiculoView = require('../views/VeiculoView');

class VeiculoController {
  static async listar(req, res) {
    try {
      const ds_categoria = req.query.ds_categoria ? req.query.ds_categoria.trim() : undefined;

      const veiculos = await VeiculoModel.listarTodos(ds_categoria);

      const mensagem = ds_categoria ? `Consulta filtrada pela categoria '${ds_categoria}' concluída (${veiculos.length} registro(s)).` : `Frota completa consultada com sucesso (${veiculos.length} registro(s)).`;

      return res.status(200).json(
        VeiculoView.sucesso(mensagem, veiculos, 200)
      );
    } catch (erro) {
      console.error('Erro ao listar veículos:', erro);
      return res.status(500).json(
        VeiculoView.erro(500, 'Falha interna ao consultar a frota de veículos no banco de dados.')
      );
    }
  }

  static async buscarPorId(req, res) {
    try {
      const id_veiculo = parseInt(req.params.id, 10);

      // Validação de Fronteira 1: Se não for um número válido ou for menor ou igual a zero = 400 Bad Request
      if (isNaN(id_veiculo) || id_veiculo <= 0) {
        return res.status(400).json(
          VeiculoView.erro(400, 'O identificador id_veiculo informado é inválido. Informe um número inteiro positivo.')
        );
      }

      const veiculo = await VeiculoModel.buscarPorId(id_veiculo);

      // Validação de Fronteira 2: Se o banco não retornar nenhum veículo = 404 Not Found
      if (!veiculo) {
        return res.status(404).json(
          VeiculoView.erro(404, `Nenhum veículo encontrado com o id_veiculo ${id_veiculo}.`)
        );
      }

      return res.status(200).json(
        VeiculoView.sucesso(`Veículo ID ${id_veiculo} localizado com sucesso.`, veiculo, 200)
      );
    } catch (erro) {
      console.error('Erro ao buscar veículo por ID:', erro);
      return res.status(500).json(
        VeiculoView.erro(500, 'Falha interna ao buscar o veículo solicitado no servidor.')
      );
    }
  }
}

module.exports = VeiculoController;