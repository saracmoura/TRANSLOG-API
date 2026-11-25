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
  
  static async cadastrar(req, res) {
    try {
      const { cd_placa, nm_modelo, ds_categoria, vl_diaria_frete, qt_quilometragem } = req.body;

      // Validação de Fronteira: Campos obrigatórios vazios = 400 Bad Request
      if (!cd_placa || !nm_modelo || !ds_categoria || String(cd_placa).trim() === '' || String(nm_modelo).trim() === '' || String(ds_categoria).trim() === '') {
        return res.status(400).json(
          VeiculoView.erro(400, 'Os campos obrigatórios (cd_placa, nm_modelo e ds_categoria) devem ser preenchidos.')
        );
      }

      // Sanitização de Tipo: Conversão dos campos numéricos
      const diariaNumerica = Number(vl_diaria_frete);
      const kmNumerica = qt_quilometragem !== undefined && qt_quilometragem !== '' ? parseInt(qt_quilometragem, 10) : 0;

      // Validação Semântica: Diária negativa ou inválida = 422 Unprocessable Entity
      if (vl_diaria_frete === undefined || vl_diaria_frete === '' || isNaN(diariaNumerica) || diariaNumerica < 0) {
        return res.status(422).json(
          VeiculoView.erro(422, 'O valor da diária de frete (vl_diaria_frete) não pode ser negativo ou inválido.')
        );
      }

      const dadosSanitizados = {
        cd_placa: String(cd_placa).trim(),
        nm_modelo: String(nm_modelo).trim(),
        ds_categoria: String(ds_categoria).trim(),
        vl_diaria_frete: diariaNumerica,
        qt_quilometragem: isNaN(kmNumerica) ? 0 : kmNumerica
      };

      const novoVeiculo = await VeiculoModel.cadastrar(dadosSanitizados);

      return res.status(201).json(
        VeiculoView.sucesso('Veículo cadastrado com sucesso na frota.', novoVeiculo, 201)
      );
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY' || erro.errno === 1062) {
        return res.status(409).json(
          VeiculoView.erro(409, `Conflito: a placa (cd_placa) '${req.body.cd_placa}' já existe no sistema.`)
        );
      }

      console.error('Erro ao cadastrar veículo:', erro);
      return res.status(500).json(
        VeiculoView.erro(500, 'Falha interna ao cadastrar o veículo no banco de dados.')
      );
    }
  }
}

module.exports = VeiculoController;