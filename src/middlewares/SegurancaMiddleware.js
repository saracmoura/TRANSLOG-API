const validarHeadersJson = (req, res, next) => {
    const accept = req.headers["accept"] || "*/*";
    if (!accept.includes("application/json") && !accept.includes("*/*")) {
        return res.status(406).json({ status: "Erro 406: Not Acceptable", mensagem: "A API responde exclusivamente em application/json." });
    }

    const metodosComBody = ["POST", "PUT", "PATCH"];
    if (metodosComBody.includes(req.method)) {
        const contentType = req.headers["content-type"] || "";
        if (!contentType.includes("application/json")) {
            return res.status(415).json({ status: "Erro 415 (Unsupported Media Type)", mensagem: "Obrigatório enviar o Content-Type: application/json." });
        }
    }
    next();
};

const verificarToken = (req, res, next) => {
    const authHeader = req.headers["authorization"] || "";
    if (authHeader !== `Bearer ${process.env.API_TOKEN}`) {
        return res.status(401).json({ Status: "Erro 401 (Unauthorized)", mensagem: "Acesso negado: Bearer Token Inválido." });
    }
    next();
};

function exigirJson(req, res, next) {
        const contentType = req.headers['content-type'] || '';
        const tipos = contentType.split(';')[0].trim().toLowerCase();
        if (tipos !== 'application/json') {
            return res.status(415).json({
                erro: 'Unsupported Media Type',
                mensagem: 'Para requisições POST, o cabeçalho Content-Type deve ser application/json.'
            });
        }
    }
    next();

module.exports = { validarHeadersJson, verificarToken, exigirJson };