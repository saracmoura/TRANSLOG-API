const mysql = require("mysql2/promise");
const pool = mysql. createpool({
host: process.env.DB_HOST, user: process.env.DB_USER, password: process. env.DB_PASSWORD,
database: process.env.DB_NAME, port: Number(process.env.DB_PORT),
waitforConnections: true, connectionLimit: 10});

class VeiculoModel {
    static async listartodos(ds_categoria) {
        if (ds_categoria) {
            const [linhas] = await pool.execute("SELECT * FROM tb_veiculos WHERE ds_categoria = ? ORDER BY id_veiculo DESC", [ds_categoria]);
            return linhas;
        }

        const [linhas] = await pool.execute("SELECT * FROM tb_veiculos ORDER BY id_veiculo DESC");
        return linhas;
    }

   static async buscarPorId(id_veiculo) {
        const [linhas] = await pool.execute("SELECT * FROM tb_veiculos WHERE id_produto = ?", [id_veiculo]);
        return linhas[0];
    }
}

module.exports = VeiculoModel;