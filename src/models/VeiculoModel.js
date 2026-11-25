const mysql = require("mysql2/promise");
const pool = mysql.createPool({
host: process.env.DB_HOST, user: process.env.DB_USER, password: process. env.DB_PASSWORD,
database: process.env.DB_NAME, port: Number(process.env.DB_PORT),
waitForConnections: true, connectionLimit: 10});

class VeiculoModel {
    static async listarTodos (ds_categoria) {
        if (ds_categoria) {
            const [linhas] = await pool.execute("SELECT * FROM tb_veiculos WHERE ds_categoria = ? ORDER BY id_veiculo DESC", [ds_categoria]);
            return linhas;
        }

        const [linhas] = await pool.execute("SELECT * FROM tb_veiculos ORDER BY id_veiculo DESC");
        return linhas;
    }

   static async buscarPorId(id_veiculo) {
        const [linhas] = await pool.execute("SELECT * FROM tb_veiculo WHERE id_produto = ?", [id_veiculo]);
        return linhas[0];
    }

    static async cadastrar(veiculo) {
        const sql ="INSERT INTO tb_veiculos SET cd_placa, nm_modelo, ds_categoria, vl_diaria_frete, qt_quilometragem VALUES (?, ?, ?, ?, ?)";
        const valores = [veiculo.cd_placa, veiculo.nm_modelo, veiculo.ds_categoria, veiculo.vl_diaria_frete, veiculo.qt_quilometragem];
        const [resultado] = await pool.execute(sql, valores);
        return{ id_veiculo: resultado.insertId, ...veiculo};
    }
}

module.exports = VeiculoModel;