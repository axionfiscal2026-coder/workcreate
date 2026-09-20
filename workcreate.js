// ----------------------------------------------------------------------
// DICIONÁRIO DE DADOS E CONFIGURAÇÃO DE COLUNAS
// ----------------------------------------------------------------------
const defaultFields = [
    { id: 'ide_nNF', cat: 'NOTA', xmlPath: 'ide nNF', label: 'Número da Nota', checked: true },
    { id: 'ide_serie', cat: 'NOTA', xmlPath: 'ide serie', label: 'Série', checked: true },
    { id: 'ide_dhEmi', cat: 'NOTA', xmlPath: 'ide dhEmi', label: 'Data Emissão', checked: true },
    { id: 'emit_CNPJ', cat: 'EMIT', xmlPath: 'emit CNPJ', label: 'CNPJ Emitente', checked: true },
    { id: 'emit_xNome', cat: 'EMIT', xmlPath: 'emit xNome', label: 'Nome Emitente', checked: true },
    { id: 'emit_UF', cat: 'EMIT', xmlPath: 'emit enderEmit UF', label: 'UF Emitente', checked: false },
    { id: 'prod_cProd', cat: 'PROD', xmlPath: 'det prod cProd', label: 'Cód. Produto', checked: true },
    { id: 'prod_xProd', cat: 'PROD', xmlPath: 'det prod xProd', label: 'Descrição', checked: true },
    { id: 'prod_NCM', cat: 'PROD', xmlPath: 'det prod NCM', label: 'NCM', checked: true },
    { id: 'prod_uCom', cat: 'PROD', xmlPath: 'det prod uCom', label: 'UN', checked: true },
    { id: 'prod_qCom', cat: 'PROD', xmlPath: 'det prod qCom', label: 'Quantidade', checked: true },
    { id: 'prod_vUnCom', cat: 'PROD', xmlPath: 'det prod vUnCom', label: 'VALOR UNITÁRIO (R$)', checked: true },
    { id: 'prod_vProd', cat: 'PROD', xmlPath: 'det prod vProd', label: 'VALOR TOTAL (R$)', checked: true },
    { id: 'tot_vNF', cat: 'TOTAL', xmlPath: 'total ICMSTot vNF', label: 'Valor Total da Nota', checked: true }
];

let config = JSON.parse(localStorage.getItem('nfe_config_v3')) || defaultFields;

// Garante atualização dos labels caso o usuário já tenha o localStorage antigo
config.forEach(f => {
    if (f.id === 'prod_vUnCom') f.label = 'VALOR UNITÁRIO (R$)';
    if (f.id === 'prod_vProd') f.label = 'VALOR TOTAL (R$)';
});

let cadastrosLocais = JSON.parse(localStorage.getItem('opm_cadastros_tasy')) || [];
let arquivosSalvos = JSON.parse(localStorage.getItem('opm_arquivos_salvos')) || [];
let idSelecionadoGlobal = null;

let dadosTabelaExtraida = [];
let tabelaConvertida = false;
let tituloAtualConclusao = "";
let dadosAtuaisVisualizacao = [];

let modoAtual = 'normal';
let itensSelecionadosExcluir = new Set();

let modoExclusaoArquivosAtivo = false;
let arquivosSelecionadosParaExcluir = new Set();
let itensPreviaMassaTemporarios = [];

document.addEventListener('DOMContentLoaded', () => {
    renderConfig();
    renderizarTabelasCadastros();
    renderizarListaArquivos();

    const btnExtrair = document.getElementById('btnExtrair');
    if (btnExtrair) {
        btnExtrair.addEventListener('click', extrairXML);
    }
});

// ----------------------------------------------------------------------
// ALTERNAÇÃO DE ABAS COM TÍTULO GLOBAL DINÂMICO
// ----------------------------------------------------------------------
function trocarAba(aba) {
    const secExtrator = document.getElementById('sectionExtrator');
    const secCadastro = document.getElementById('sectionCadastro');
    const secArquivos = document.getElementById('sectionArquivos');
    const btnExtrator = document.getElementById('tabExtratorBtn');
    const btnCadastro = document.getElementById('tabCadastroBtn');
    const btnArquivos = document.getElementById('tabArquivosBtn');
    const titleDisplay = document.getElementById('pageTitleDisplay');

    if (aba === 'extrator') {
        secExtrator.style.display = 'block';
        secCadastro.style.display = 'none';
        secArquivos.style.display = 'none';
        btnExtrator.classList.add('active');
        btnCadastro.classList.remove('active');
        btnArquivos.classList.remove('active');
        if (titleDisplay) titleDisplay.innerText = "EXTRATOR DE XML NFE";
    } else if (aba === 'cadastro') {
        secExtrator.style.display = 'none';
        secCadastro.style.display = 'block';
        secArquivos.style.display = 'none';
        btnExtrator.classList.remove('active');
        btnCadastro.classList.add('active');
        btnArquivos.classList.remove('active');
        if (titleDisplay) titleDisplay.innerText = "CADASTRO DE PRODUTOS / EQUIVALÊNCIA";
        renderizarTabelasCadastros();
    } else if (aba === 'arquivos') {
        secExtrator.style.display = 'none';
        secCadastro.style.display = 'none';
        secArquivos.style.display = 'block';
        btnExtrator.classList.remove('active');
        btnCadastro.classList.remove('active');
        btnArquivos.classList.add('active');
        if (titleDisplay) titleDisplay.innerText = "ARQUIVOS / LISTAS CONCLUÍDAS";
        cancelarModoExclusaoArquivos();
        renderizarListaArquivos();
    }
}

// ----------------------------------------------------------------------
// RENDERIZAÇÃO E CONFIGURAÇÕES DE COLUNAS
// ----------------------------------------------------------------------
function renderConfig() {
    const list = document.getElementById('field-list');
    if (!list) return;
    list.innerHTML = '';
    
    config.forEach((field, index) => {
        const li = document.createElement('li');
        li.className = 'field-item';
        li.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%;">
                <span class="category-tag">${field.cat}</span>
                <input type="checkbox" id="chk_${field.id}" ${field.checked ? 'checked' : ''}>
                <label for="chk_${field.id}">${field.label}</label>
            </div>
            <div style="white-space: nowrap;">
                <button type="button" class="btn-move" onclick="moveItem(${index}, -1)">▲</button>
                <button type="button" class="btn-move" onclick="moveItem(${index}, 1)">▼</button>
            </div>
        `;
        
        const checkbox = li.querySelector(`#chk_${field.id}`);
        checkbox.addEventListener('change', updateConfig);

        list.appendChild(li);
    });
}

function moveItem(index, direction) {
    if (index + direction < 0 || index + direction >= config.length) return;
    const temp = config[index];
    config[index] = config[index + direction];
    config[index + direction] = temp;
    updateConfig();
    renderConfig();
}

function updateConfig() {
    config.forEach(field => {
        const cb = document.getElementById(`chk_${field.id}`);
        if (cb) field.checked = cb.checked;
    });
    localStorage.setItem('nfe_config_v3', JSON.stringify(config));
    
    if (typeof window.syncWorkCreateFirebase === "function") {
        window.syncWorkCreateFirebase({ configColunas: config });
    }
}

function formatarValorCampo(fieldId, rawValue) {
    if (!rawValue || rawValue.trim() === "") return "-";

    if (fieldId === 'prod_uCom') {
        return rawValue.trim().toUpperCase();
    }

    const numero = parseFloat(rawValue.replace(',', '.'));
    if (isNaN(numero)) return rawValue;

    if (fieldId === 'prod_qCom') {
        return numero.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
    }

    if (fieldId === 'prod_vUnCom') {
        return "R$ " + numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }

    if (
        fieldId.includes('vProd') || 
        fieldId.includes('vNF') || 
        fieldId.includes('vBC') || 
        fieldId.includes('vICMS') || 
        fieldId.includes('vIPI') || 
        fieldId.includes('vFrete') || 
        fieldId.includes('vDesc')
    ) {
        const formatado = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (fieldId === 'prod_vProd') ? "R$ " + formatado : formatado;
    }

    return rawValue;
}

function getNodeByPath(startNode, pathString) {
    const tags = pathString.split(' ');
    let current = startNode;
    
    for (let tag of tags) {
        if (!current) return null;
        let el = Array.from(current.children).find(child => child.localName === tag);
        if (!el) return null;
        current = el;
    }
    return current ? current.textContent : '';
}

function extrairXML() {
    const input = document.getElementById('xmlInput');
    if (!input || input.files.length === 0) {
        alert("Selecione pelo menos um arquivo XML para extrair.");
        return;
    }

    dadosTabelaExtraida = [];
    tabelaConvertida = false;

    const activeFields = config.filter(f => f.checked);
    const files = Array.from(input.files);
    let lidos = 0;

    files.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
            const infNFe = xmlDoc.getElementsByTagName('infNFe')[0] || xmlDoc.querySelector('*[localName="infNFe"]');

            if (infNFe) {
                const detalhes = Array.from(infNFe.children).filter(child => child.localName === 'det');
                
                detalhes.forEach(detNode => {
                    const rowData = { _id: Date.now() + Math.random(), _rawValues: {}, _transferencia: '', _selected: true };
                    
                    rowData._rawValues['ide_nNF'] = getNodeByPath(infNFe, 'ide nNF') || '';

                    activeFields.forEach(f => {
                        let rawValue = '';
                        if (f.xmlPath.startsWith('det ')) {
                            rawValue = getNodeByPath(detNode, f.xmlPath.substring(4));
                        } else {
                            rawValue = getNodeByPath(infNFe, f.xmlPath);
                        }
                        rowData._rawValues[f.id] = rawValue;
                        rowData[f.id] = formatarValorCampo(f.id, rawValue) || '-';
                    });

                    dadosTabelaExtraida.push(rowData);
                });
            }

            lidos++;
            if (lidos === files.length) {
                renderizarPreVisualizacao();
                document.getElementById('cardPreVisualizacao').style.display = 'block';
                mostrarNotificacaoToast("Dados extraídos com sucesso!");
                
                const cardPrevis = document.getElementById('cardPreVisualizacao');
                if (cardPrevis) cardPrevis.scrollIntoView({ behavior: 'smooth' });
            }
        };
        
        reader.readAsText(file);
    });
}

function renderizarPreVisualizacao() {
    const activeFields = config.filter(f => f.checked);
    const thead = document.getElementById('previewTableHead');
    const tbody = document.getElementById('previewTableBody');

    thead.innerHTML = '<tr>' + activeFields.map(f => `<th>${f.label}</th>`).join('') + '</tr>';
    tbody.innerHTML = '';

    dadosTabelaExtraida.forEach(row => {
        const tr = document.createElement('tr');
        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function gerarTabelaFinal() {
    document.getElementById('stepExtracaoInicial').style.display = 'none';
    document.getElementById('stepTabelaFinal').style.display = 'block';
    
    renderizarTabelaExtraidaOriginal();
    
    const mainArea = document.querySelector('.content-area-full');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
}

function voltarParaExtracao() {
    document.getElementById('stepTabelaFinal').style.display = 'none';
    document.getElementById('stepExtracaoInicial').style.display = 'block';
}

function renderizarTabelaExtraidaOriginal() {
    const activeFields = config.filter(f => f.checked);
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');

    let headersHtml = '<tr>' + activeFields.map(f => `<th>${f.label}</th>`).join('');
    headersHtml += `<th class="text-center">Ações</th></tr>`;
    thead.innerHTML = headersHtml;

    tbody.innerHTML = '';

    dadosTabelaExtraida.forEach((row, idx) => {
        const tr = document.createElement('tr');

        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });

        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'text-center action-status-cell';
        tdAcoes.innerHTML = `
            <button type="button" class="btn-action-tbl btn-editar" onclick="abrirModalEditarItemExtraido(${idx})" title="Editar Item">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn-action-tbl btn-excluir" onclick="removerItemExtraidoOriginal(${idx})" title="Excluir Item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        tr.appendChild(tdAcoes);
        tbody.appendChild(tr);
    });
}

function abrirModalEditarItemExtraido(idx) {
    const item = dadosTabelaExtraida[idx];
    if (!item) return;

    document.getElementById('editItemExtraidoIdx').value = idx;
    const activeFields = config.filter(f => f.checked);
    const container = document.getElementById('containerCamposEdicaoItem');

    container.innerHTML = activeFields.map(f => `
        <div class="form-group">
            <label for="field_edit_${f.id}">${f.label}</label>
            <input type="text" id="field_edit_${f.id}" value="${item[f.id] !== '-' ? item[f.id] : ''}" placeholder="${f.label}">
        </div>
    `).join('');

    const modal = document.getElementById('modalEditarItemExtraido');
    if (modal) modal.classList.add('show');
}

function fecharModalEditarItemExtraido() {
    const modal = document.getElementById('modalEditarItemExtraido');
    if (modal) modal.classList.remove('show');
}

function salvarEdicaoItemExtraido(e) {
    if (e && e.preventDefault) e.preventDefault();

    const idx = parseInt(document.getElementById('editItemExtraidoIdx').value, 10);
    if (isNaN(idx) || !dadosTabelaExtraida[idx]) return;

    const activeFields = config.filter(f => f.checked);
    activeFields.forEach(f => {
        const inp = document.getElementById(`field_edit_${f.id}`);
        if (inp) {
            const val = inp.value.trim();
            dadosTabelaExtraida[idx][f.id] = val || '-';
            dadosTabelaExtraida[idx]._rawValues[f.id] = val;
        }
    });

    fecharModalEditarItemExtraido();
    renderizarTabelaExtraidaOriginal();
    mostrarNotificacaoToast("Item atualizado com sucesso!");
}

function removerItemExtraidoOriginal(idx) {
    if (confirm("Deseja remover este item da tabela de dados extraídos?")) {
        dadosTabelaExtraida.splice(idx, 1);
        renderizarTabelaExtraidaOriginal();
        mostrarNotificacaoToast("Item removido com sucesso!");
    }
}

function abrirEExecutarConversaoTasy() {
    if (dadosTabelaExtraida.length === 0) return;

    tabelaConvertida = true;
    let todosConvertidos = true;

    dadosTabelaExtraida.forEach(row => {
        const codFornOriginal = row._rawValues['prod_cProd'] || row['prod_cProd'];
        const match = cadastrosLocais.find(c => String(c.codForn).trim().toLowerCase() === String(codFornOriginal).trim().toLowerCase());

        if (match) {
            row._convertido = true;
            if (row.hasOwnProperty('prod_cProd')) row['prod_cProd'] = match.codTasy;
            if (row.hasOwnProperty('prod_xProd')) row['prod_xProd'] = match.descTasy;
        } else {
            row._convertido = false;
            todosConvertidos = false;
        }
    });

    renderizarTabelaModalTasy();

    const btnProxima = document.getElementById('btnProximaEtapaModal');
    if (btnProxima) {
        btnProxima.disabled = !todosConvertidos;
    }

    const modal = document.getElementById('modalConversaoTasy');
    if (modal) modal.classList.add('show');

    if (todosConvertidos) {
        mostrarNotificacaoToast("Todos os itens convertidos! Você pode avançar.");
    } else {
        mostrarNotificacaoToast("Cadastre os itens em vermelho para liberar a próxima etapa.");
    }
}

function fecharModalConversaoTasy() {
    const modal = document.getElementById('modalConversaoTasy');
    if (modal) modal.classList.remove('show');
}

function renderizarTabelaModalTasy() {
    const activeFields = config.filter(f => f.checked);
    const thead = document.getElementById('modalTasyTableHead');
    const tbody = document.getElementById('modalTasyTableBody');

    let headersHtml = '<tr>' + activeFields.map(f => {
        let title = f.label;
        if (f.id === 'prod_cProd') title = 'Cód. Tasy';
        if (f.id === 'prod_xProd') title = 'Descrição Tasy';
        return `<th>${title}</th>`;
    }).join('');

    headersHtml += `<th class="text-center">Ações</th></tr>`;
    thead.innerHTML = headersHtml;

    tbody.innerHTML = '';

    dadosTabelaExtraida.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = row._convertido ? 'row-success' : 'row-danger';

        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });

        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'text-center action-status-cell';

        if (row._convertido) {
            tdAcoes.innerHTML = `<i class="fa-solid fa-circle-check icon-success-check" title="Item Convertido"></i>`;
        } else {
            const rawCod = row._rawValues['prod_cProd'] || row['prod_cProd'] || '';
            const rawDesc = row._rawValues['prod_xProd'] || row['prod_xProd'] || '';
            tdAcoes.innerHTML = `<button type="button" class="btn-quick-add" onclick="abrirModalCadastroRapido('${rawCod}', '${rawDesc.replace(/'/g, "\\'")}')" title="Cadastro Rápido Tasy"><i class="fa-solid fa-plus"></i></button>`;
        }

        tr.appendChild(tdAcoes);
        tbody.appendChild(tr);
    });
}

function avancarParaTransferenciaDaJanela() {
    fecharModalConversaoTasy();
    avancarParaTransferencia();
}

function avancarParaTransferencia() {
    document.getElementById('stepTabelaFinal').style.display = 'none';
    document.getElementById('stepTransferenciaTasy').style.display = 'block';

    const inputNota = document.getElementById('inputFiltroNotaFiscal');
    if (inputNota) inputNota.value = '';

    const selectModo = document.getElementById('selectTipoPreenchimento');
    if (selectModo) selectModo.value = 'todos';

    alterarModoSelecaoTransferencia();
}

function voltarParaConversao() {
    document.getElementById('stepTransferenciaTasy').style.display = 'none';
    document.getElementById('stepTabelaFinal').style.display = 'block';
    abrirEExecutarConversaoTasy();
}

function obterItensVisiveisTransferencia() {
    const termoNota = (document.getElementById('inputFiltroNotaFiscal')?.value || '').trim().toLowerCase();
    
    if (!termoNota) {
        return dadosTabelaExtraida;
    }

    return dadosTabelaExtraida.filter(row => {
        const numNota = String(row._rawValues['ide_nNF'] || row['ide_nNF'] || '').toLowerCase();
        return numNota.includes(termoNota);
    });
}

function filtrarPorNotaFiscal() {
    renderizarTabelasEStatusTransferencia();
}

function alterarModoSelecaoTransferencia() {
    const modo = document.getElementById('selectTipoPreenchimento').value;
    const inputBulk = document.getElementById('inputBulkTransferencia');
    const btnAplicar = document.getElementById('btnAplicarBulk');

    const itensVisiveis = obterItensVisiveisTransferencia();

    if (modo === 'todos') {
        itensVisiveis.forEach(row => row._selected = true);
        if (inputBulk) inputBulk.disabled = false;
        if (btnAplicar) btnAplicar.disabled = false;
    } else if (modo === 'selecionados') {
        itensVisiveis.forEach(row => row._selected = false);
        if (inputBulk) inputBulk.disabled = false;
        if (btnAplicar) btnAplicar.disabled = false;
    } else if (modo === 'livre') {
        itensVisiveis.forEach(row => row._selected = false);
        if (inputBulk) {
            inputBulk.value = '';
            inputBulk.disabled = true;
        }
        if (btnAplicar) btnAplicar.disabled = true;
    }

    renderizarTabelasEStatusTransferencia();
}

function renderizarTabelasEStatusTransferencia() {
    renderizarTabelaTransferencia();
    validarTransferenciasPreenchidas();
}

function renderizarTabelaTransferencia() {
    const activeFields = config.filter(f => f.checked);
    const thead = document.getElementById('transferTableHead');
    const tbody = document.getElementById('transferTableBody');

    const modo = document.getElementById('selectTipoPreenchimento').value;
    const isLivre = (modo === 'livre');

    const itensVisiveis = obterItensVisiveisTransferencia();
    const todosSelecionados = itensVisiveis.length > 0 && itensVisiveis.every(r => r._selected);

    let headersHtml = '<tr>';
    if (!isLivre) {
        headersHtml += `<th class="col-select-header"><input type="checkbox" class="cell-checkbox" ${todosSelecionados ? 'checked' : ''} onchange="toggleSelectAllTransfer(this)"></th>`;
    }
    headersHtml += activeFields.map(f => {
        let title = f.label;
        if (f.id === 'prod_cProd') title = 'Cód. Tasy';
        if (f.id === 'prod_xProd') title = 'Descrição Tasy';
        return `<th>${title}</th>`;
    }).join('');
    headersHtml += `<th>Transferência Tasy *</th></tr>`;

    thead.innerHTML = headersHtml;
    tbody.innerHTML = '';

    if (itensVisiveis.length === 0) {
        const colspanVal = isLivre ? activeFields.length + 1 : activeFields.length + 2;
        tbody.innerHTML = `<tr><td colspan="${colspanVal}" style="text-align: center; padding: 20px; color: var(--text-muted);">Nenhum item encontrado para esta Nota Fiscal.</td></tr>`;
        return;
    }

    itensVisiveis.forEach((row) => {
        const realIndex = dadosTabelaExtraida.indexOf(row);
        const tr = document.createElement('tr');

        const isPreenchido = row._transferencia && row._transferencia.trim() !== '';
        if (isPreenchido) {
            tr.className = 'row-transfer-completed';
        }

        if (!isLivre) {
            const tdCheck = document.createElement('td');
            tdCheck.className = 'col-select-cell';
            tdCheck.innerHTML = `<input type="checkbox" class="cell-checkbox" ${row._selected ? 'checked' : ''} onchange="toggleSelectRowTransfer(${realIndex}, this.checked)">`;
            tr.appendChild(tdCheck);
        }

        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });

        const tdTransf = document.createElement('td');
        tdTransf.innerHTML = `<input type="text" class="table-input-transfer" value="${row._transferencia || ''}" placeholder="Digite a transferência..." oninput="atualizarValorTransferencia(${realIndex}, this.value)">`;
        tr.appendChild(tdTransf);

        tbody.appendChild(tr);
    });
}

function toggleSelectAllTransfer(masterCb) {
    const itensVisiveis = obterItensVisiveisTransferencia();
    itensVisiveis.forEach(row => row._selected = masterCb.checked);
    renderizarTabelaTransferencia();
}

function toggleSelectRowTransfer(idx, isChecked) {
    if (dadosTabelaExtraida[idx]) dadosTabelaExtraida[idx]._selected = isChecked;

    const itensVisiveis = obterItensVisiveisTransferencia();
    const todosSelecionados = itensVisiveis.length > 0 && itensVisiveis.every(r => r._selected);
    const masterCb = document.querySelector('#transferTableHead .cell-checkbox');
    if (masterCb) masterCb.checked = todosSelecionados;
}

function atualizarValorTransferencia(idx, valor) {
    if (dadosTabelaExtraida[idx]) {
        dadosTabelaExtraida[idx]._transferencia = valor;
        
        const tbody = document.getElementById('transferTableBody');
        const rows = tbody.querySelectorAll('tr');
        const itensVisiveis = obterItensVisiveisTransferencia();
        const itemAlvo = dadosTabelaExtraida[idx];
        const visIdx = itensVisiveis.indexOf(itemAlvo);

        if (visIdx !== -1 && rows[visIdx]) {
            const trAlvo = rows[visIdx];
            if (valor && valor.trim() !== '') {
                trAlvo.classList.add('row-transfer-completed');
            } else {
                trAlvo.classList.remove('row-transfer-completed');
            }
        }
    }
    validarTransferenciasPreenchidas();
}

function aplicarTransferenciaEmMassa() {
    const val = document.getElementById('inputBulkTransferencia').value.trim();
    const modo = document.getElementById('selectTipoPreenchimento').value;

    if (modo === 'livre') return;

    if (!val) {
        alert("Digite o valor da Transferência Tasy para aplicar.");
        return;
    }

    const itensVisiveis = obterItensVisiveisTransferencia();

    itensVisiveis.forEach(row => {
        if (modo === 'todos' || (modo === 'selecionados' && row._selected)) {
            row._transferencia = val;
        }
    });

    renderizarTabelasEStatusTransferencia();
    mostrarNotificacaoToast("Transferência aplicada aos itens visíveis!");
}

function limparTransferencias() {
    const modo = document.getElementById('selectTipoPreenchimento').value;
    const itensVisiveis = obterItensVisiveisTransferencia();

    itensVisiveis.forEach(row => {
        if (modo === 'todos' || modo === 'livre' || (modo === 'selecionados' && row._selected)) {
            row._transferencia = '';
        }
    });

    renderizarTabelasEStatusTransferencia();
    mostrarNotificacaoToast("Campos de transferência limpos!");
}

function validarTransferenciasPreenchidas() {
    const btnRevisar = document.getElementById('btnRevisarEtapa');
    if (!btnRevisar) return;

    const todosPreenchidos = dadosTabelaExtraida.length > 0 && dadosTabelaExtraida.every(r => r._transferencia && r._transferencia.trim() !== '');
    btnRevisar.disabled = !todosPreenchidos;
}

function avancarParaRevisao() {
    document.getElementById('stepTransferenciaTasy').style.display = 'none';
    document.getElementById('stepRevisaoFinal').style.display = 'block';

    renderizarTabelaRevisao();
}

function voltarParaTransferencia() {
    document.getElementById('stepRevisaoFinal').style.display = 'none';
    document.getElementById('stepTransferenciaTasy').style.display = 'block';
}

function renderizarTabelaRevisao() {
    const activeFields = config.filter(f => f.checked);
    const thead = document.getElementById('revisaoTableHead');
    const tbody = document.getElementById('revisaoTableBody');

    let headersHtml = '<tr>' + activeFields.map(f => {
        let title = f.label;
        if (f.id === 'prod_cProd') title = 'Cód. Tasy';
        if (f.id === 'prod_xProd') title = 'Descrição Tasy';
        return `<th>${title}</th>`;
    }).join('');
    headersHtml += `<th>Transferência Tasy</th></tr>`;

    thead.innerHTML = headersHtml;
    tbody.innerHTML = '';

    dadosTabelaExtraida.forEach((row) => {
        const tr = document.createElement('tr');

        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });

        const tdTransf = document.createElement('td');
        tdTransf.innerHTML = `<strong>${row._transferencia || '-'}</strong>`;
        tr.appendChild(tdTransf);

        tbody.appendChild(tr);
    });
}

function abrirModalConfirmarFinalizacao() {
    const modal = document.getElementById('modalConfirmarFinalizacao');
    if (modal) modal.classList.add('show');
}

function fecharModalConfirmarFinalizacao() {
    const modal = document.getElementById('modalConfirmarFinalizacao');
    if (modal) modal.classList.remove('show');
}

function confirmarFinalizacaoAviso() {
    fecharModalConfirmarFinalizacao();
    abrirModalTituloConclusao();
}

function abrirModalTituloConclusao() {
    document.getElementById('inputTituloConclusao').value = `Lista de Transferência - ${new Date().toLocaleDateString('pt-BR')}`;
    const modal = document.getElementById('modalTituloConclusao');
    if (modal) modal.classList.add('show');
}

function fecharModalTituloConclusao() {
    const modal = document.getElementById('modalTituloConclusao');
    if (modal) modal.classList.remove('show');
}

function confirmarConclusaoComTitulo() {
    const titulo = document.getElementById('inputTituloConclusao').value.trim();
    if (!titulo) {
        alert("Informe um título para a lista.");
        return;
    }

    tituloAtualConclusao = titulo;
    fecharModalTituloConclusao();

    const novoArquivo = {
        id: Date.now(),
        titulo: titulo,
        dataHora: new Date().toLocaleString('pt-BR'),
        dados: JSON.parse(JSON.stringify(dadosTabelaExtraida)),
        configColunas: JSON.parse(JSON.stringify(config))
    };

    arquivosSalvos.unshift(novoArquivo);
    localStorage.setItem('opm_arquivos_salvos', JSON.stringify(arquivosSalvos));

    if (typeof window.syncWorkCreateFirebase === "function") {
        window.syncWorkCreateFirebase({ arquivosSalvos: arquivosSalvos });
    }

    renderizarListaArquivos();
    exibirResultadoFinal(novoArquivo.dados, titulo);
}

function exibirResultadoFinal(dados, titulo) {
    document.getElementById('stepRevisaoFinal').style.display = 'none';
    document.getElementById('stepResultadoFinal').style.display = 'block';

    document.getElementById('pageTitleDisplay').innerText = titulo.toUpperCase();
    dadosAtuaisVisualizacao = dados;

    const activeFields = config.filter(f => f.checked);
    const thead = document.getElementById('resultadoFinalTableHead');
    const tbody = document.getElementById('resultadoFinalTableBody');

    let headersHtml = '<tr>' + activeFields.map(f => {
        let title = f.label;
        if (f.id === 'prod_cProd') title = 'Cód. Tasy';
        if (f.id === 'prod_xProd') title = 'Descrição Tasy';
        return `<th>${title}</th>`;
    }).join('');
    headersHtml += `<th>Transferência Tasy</th></tr>`;

    thead.innerHTML = headersHtml;
    tbody.innerHTML = '';

    dados.forEach(row => {
        const tr = document.createElement('tr');
        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });

        const tdTransf = document.createElement('td');
        tdTransf.innerHTML = `<strong>${row._transferencia || '-'}</strong>`;
        tr.appendChild(tdTransf);

        tbody.appendChild(tr);
    });

    const mainArea = document.querySelector('.content-area-full');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
}

function irParaInicio() {
    document.getElementById('stepResultadoFinal').style.display = 'none';
    document.getElementById('stepExtracaoInicial').style.display = 'block';
    document.getElementById('pageTitleDisplay').innerText = "EXTRATOR DE XML NFE";
    dadosTabelaExtraida = [];
    const xmlInput = document.getElementById('xmlInput');
    if (xmlInput) xmlInput.value = '';
    const cardPrev = document.getElementById('cardPreVisualizacao');
    if (cardPrev) cardPrev.style.display = 'none';
}

function renderizarListaArquivos() {
    const container = document.getElementById('containerListaArquivos');
    const headerSelectAll = document.getElementById('headerSelectAllArquivos');
    if (!container) return;

    if (arquivosSalvos.length === 0) {
        if (headerSelectAll) headerSelectAll.style.display = 'none';
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum arquivo ou lista concluída salva ainda.</p>`;
        return;
    }

    if (headerSelectAll) {
        headerSelectAll.style.display = modoExclusaoArquivosAtivo ? 'flex' : 'none';
        const selectAllCb = document.getElementById('selectAllArquivosCheckbox');
        if (selectAllCb) {
            selectAllCb.checked = arquivosSalvos.length > 0 && arquivosSelecionadosParaExcluir.size === arquivosSalvos.length;
        }
    }

    container.innerHTML = arquivosSalvos.map((arq, index) => {
        const activeFields = arq.configColunas ? arq.configColunas.filter(f => f.checked) : config.filter(f => f.checked);
        const isChecked = arquivosSelecionadosParaExcluir.has(index);
        
        return `
        <div class="arquivo-item-wrapper" id="arq-wrapper-${index}">
            <div class="circle-checkbox-wrapper ${modoExclusaoArquivosAtivo ? 'show' : ''}">
                <input type="checkbox" class="circle-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelecaoArquivoParaExcluir(${index}, this.checked)">
            </div>
            <div class="arquivo-card">
                <div class="arquivo-header" onclick="toggleAcordeaoArquivo(${index})">
                    <div class="arquivo-info">
                        <h4>${arq.titulo}</h4>
                        <span><i class="fa-regular fa-clock"></i> Salvo em: ${arq.dataHora}</span>
                    </div>
                    <div class="arquivo-actions" onclick="event.stopPropagation()">
                        <button type="button" class="btn-action-header" onclick="abrirModalGerarPlanilhaEspecifica(${index})" style="background-color: #10B981; color: #FFF; padding: 6px 12px; font-size: 0.8rem;">
                            <i class="fa-solid fa-file-excel"></i> Gerar Planilha
                        </button>
                        <button type="button" class="btn-action-header btn-header-converter" onclick="imprimirArquivoEspecifico(${index})" style="padding: 6px 12px; font-size: 0.8rem;">
                            <i class="fa-solid fa-print"></i> Imprimir
                        </button>
                        <i class="fa-solid fa-chevron-down arquivo-toggle-icon" id="arq-icon-${index}" onclick="toggleAcordeaoArquivo(${index})"></i>
                    </div>
                </div>
                <div class="arquivo-body" id="arq-body-${index}">
                    <div class="table-responsive-wrapper">
                        <table class="custom-data-table">
                            <thead>
                                <tr>
                                    ${activeFields.map(f => `<th>${f.label}</th>`).join('')}
                                    <th>Transferência Tasy</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${arq.dados.map(row => `
                                    <tr>
                                        ${activeFields.map(f => `<td>${row[f.id] || '-'}</td>`).join('')}
                                        <td><strong>${row._transferencia || '-'}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function toggleSelecionarTodosArquivos(isChecked) {
    arquivosSelecionadosParaExcluir.clear();
    if (isChecked) {
        arquivosSalvos.forEach((_, idx) => arquivosSelecionadosParaExcluir.add(idx));
    }
    renderizarListaArquivos();
}

function toggleAcordeaoArquivo(index) {
    if (modoExclusaoArquivosAtivo) return;
    const body = document.getElementById(`arq-body-${index}`);
    const icon = document.getElementById(`arq-icon-${index}`);
    if (body && icon) {
        body.classList.toggle('show');
        icon.classList.toggle('rotate');
    }
}

function toggleModoExclusaoArquivos() {
    modoExclusaoArquivosAtivo = true;
    arquivosSelecionadosParaExcluir.clear();
    
    document.getElementById('btnAtivarExclusaoArquivos').style.display = 'none';
    document.getElementById('btnConfirmarExclusaoArquivos').style.display = 'inline-flex';
    document.getElementById('btnCancelarExclusaoArquivos').style.display = 'inline-flex';

    renderizarListaArquivos();
}

function cancelarModoExclusaoArquivos() {
    modoExclusaoArquivosAtivo = false;
    arquivosSelecionadosParaExcluir.clear();

    document.getElementById('btnAtivarExclusaoArquivos').style.display = 'inline-flex';
    document.getElementById('btnConfirmarExclusaoArquivos').style.display = 'none';
    document.getElementById('btnCancelarExclusaoArquivos').style.display = 'none';

    renderizarListaArquivos();
}

function toggleSelecaoArquivoParaExcluir(index, isChecked) {
    if (isChecked) {
        arquivosSelecionadosParaExcluir.add(index);
    } else {
        arquivosSelecionadosParaExcluir.delete(index);
    }
    const selectAllCb = document.getElementById('selectAllArquivosCheckbox');
    if (selectAllCb) {
        selectAllCb.checked = arquivosSalvos.length > 0 && arquivosSelecionadosParaExcluir.size === arquivosSalvos.length;
    }
}

function solicitarConfirmacaoExclusaoArquivos() {
    const qtd = arquivosSelecionadosParaExcluir.size;
    if (qtd === 0) {
        alert("Selecione pelo menos uma lista para excluir.");
        return;
    }

    const txt = document.getElementById('modalExcluirArquivosTexto');
    if (txt) {
        txt.innerText = `Deseja realmente excluir ${qtd} ${qtd === 1 ? 'lista selecionada' : 'listas selecionadas'}?`;
    }

    const modal = document.getElementById('modalConfirmExcluirArquivos');
    if (modal) modal.classList.add('show');
}

function fecharModalExcluirArquivos() {
    const modal = document.getElementById('modalConfirmExcluirArquivos');
    if (modal) modal.classList.remove('show');
}

function confirmarExclusaoArquivosSelecionados() {
    fecharModalExcluirArquivos();

    arquivosSalvos = arquivosSalvos.filter((_, idx) => !arquivosSelecionadosParaExcluir.has(idx));
    localStorage.setItem('opm_arquivos_salvos', JSON.stringify(arquivosSalvos));

    if (typeof window.syncWorkCreateFirebase === "function") {
        window.syncWorkCreateFirebase({ arquivosSalvos: arquivosSalvos });
    }

    const qtdRemovida = arquivosSelecionadosParaExcluir.size;
    cancelarModoExclusaoArquivos();
    mostrarNotificacaoToast(`${qtdRemovida} ${qtdRemovida === 1 ? 'lista excluída' : 'listas excluídas'} com sucesso!`);
}

function abrirModalGerarPlanilhaAtiva() {
    abrirModalGerarPlanilhaComDados(dadosAtuaisVisualizacao, "VERSÃO PLANILHA (EXCEL)");
}

function abrirModalGerarPlanilhaEspecifica(index) {
    const arq = arquivosSalvos[index];
    if (!arq) return;
    abrirModalGerarPlanilhaComDados(arq.dados, arq.titulo);
}

function abrirModalGerarPlanilhaComDados(dados, titulo) {
    if (!dados || dados.length === 0) {
        alert("Não há dados para gerar a planilha.");
        return;
    }

    const activeFields = config.filter(f => f.checked);
    document.getElementById('tituloModalPlanilha').innerText = titulo;
    const thead = document.getElementById('planilhaTableHead');
    const tbody = document.getElementById('planilhaTableBody');

    let headersHtml = '<tr>' + activeFields.map(f => {
        let title = f.label;
        if (f.id === 'prod_cProd') title = 'Cód. Tasy';
        if (f.id === 'prod_xProd') title = 'Descrição Tasy';
        return `<th>${title}</th>`;
    }).join('');
    headersHtml += `<th>Transferência Tasy</th></tr>`;

    thead.innerHTML = headersHtml;
    tbody.innerHTML = '';

    dados.forEach(row => {
        const tr = document.createElement('tr');
        activeFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f.id] || '-';
            tr.appendChild(td);
        });

        const tdTransf = document.createElement('td');
        tdTransf.textContent = row._transferencia || '-';
        tr.appendChild(tdTransf);

        tbody.appendChild(tr);
    });

    window._dadosTemporariosCopia = dados;

    const modal = document.getElementById('modalGerarPlanilha');
    if (modal) modal.classList.add('show');
}

function fecharModalGerarPlanilha() {
    const modal = document.getElementById('modalGerarPlanilha');
    if (modal) modal.classList.remove('show');
}

function copiarDadosPlanilha() {
    const activeFields = config.filter(f => f.checked);
    const dados = window._dadosTemporariosCopia || dadosAtuaisVisualizacao;

    let textoCopia = activeFields.map(f => {
        let title = f.label;
        if (f.id === 'prod_cProd') title = 'Cód. Tasy';
        if (f.id === 'prod_xProd') title = 'Descrição Tasy';
        return title;
    }).concat(['Transferência Tasy']).join('\t') + '\n';

    dados.forEach(row => {
        let linhaDados = activeFields.map(f => row[f.id] || '-').concat([row._transferencia || '-']).join('\t');
        textoCopia += linhaDados + '\n';
    });

    navigator.clipboard.writeText(textoCopia).then(() => {
        mostrarNotificacaoToast("Planilha copiada! Cole no Excel com Ctrl+V.");
    }).catch(err => {
        console.error("Erro ao copiar planilha: ", err);
        alert("Não foi possível copiar automaticamente.");
    });
}

function finalizarEGerarGuiaImpressao() {
    gerarGuiaImpressaoComDados(dadosAtuaisVisualizacao, tituloAtualConclusao || "RELATÓRIO DE TRANSFERÊNCIA TASY");
}

function imprimirArquivoEspecifico(index) {
    const arq = arquivosSalvos[index];
    if (!arq) return;
    gerarGuiaImpressaoComDados(arq.dados, arq.titulo);
}

function gerarGuiaImpressaoComDados(dados, tituloRelatorio) {
    if (!dados || dados.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }

    const activeFields = config.filter(f => f.checked);

    let htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>${tituloRelatorio} - OPM</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
            body { padding: 20px; background-color: #FFF; color: #1E293B; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
            th { background-color: #F1F5F9; color: #035AA6; font-weight: 700; text-align: center !important; padding: 10px; border: 1px solid #CBD5E1; text-transform: uppercase; }
            td { padding: 10px; border: 1px solid #CBD5E1; text-align: center !important; }
            tr:nth-child(even) { background-color: #F8FAFC; }
            @page { size: auto; margin: 5mm; }
            @media print {
                body { padding: 0; }
            }
        </style>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    ${activeFields.map(f => {
                        let label = f.label;
                        if (f.id === 'prod_cProd') label = 'Cód. Tasy';
                        if (f.id === 'prod_xProd') label = 'Descrição Tasy';
                        return `<th>${label}</th>`;
                    }).join('')}
                    <th>Transferência Tasy</th>
                </tr>
            </thead>
            <tbody>
                ${dados.map(row => `
                    <tr>
                        ${activeFields.map(f => `<td>${row[f.id] || '-'}</td>`).join('')}
                        <td><strong>${row._transferencia || '-'}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}

function abrirModalCadastroRapido(codForn, descForn) {
    document.getElementById('quickCodFornecedor').value = codForn;
    document.getElementById('quickDescFornecedor').value = descForn;
    document.getElementById('quickCodTasy').value = '';
    document.getElementById('quickDescTasy').value = '';

    const modal = document.getElementById('modalCadastroRapido');
    if (modal) modal.classList.add('show');
}

function fecharModalCadastroRapido() {
    const modal = document.getElementById('modalCadastroRapido');
    if (modal) modal.classList.remove('show');
}

function salvarCadastroRapido(e) {
    if (e && e.preventDefault) e.preventDefault();

    const codForn = document.getElementById('quickCodFornecedor').value.trim();
    const descForn = document.getElementById('quickDescFornecedor').value.trim();
    const codTasy = document.getElementById('quickCodTasy').value.trim();
    const descTasy = document.getElementById('quickDescTasy').value.trim();

    if (!codForn || !descForn || !codTasy || !descTasy) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    const existente = cadastrosLocais.find(c => String(c.codForn).trim().toLowerCase() === codForn.toLowerCase());
    if (existente) {
        existente.codTasy = codTasy;
        existente.descTasy = descTasy;
    } else {
        cadastrosLocais.push({ id: Date.now(), codForn, descForn, codTasy, descTasy });
    }

    localStorage.setItem('opm_cadastros_tasy', JSON.stringify(cadastrosLocais));

    if (typeof window.syncWorkCreateFirebase === "function") {
        window.syncWorkCreateFirebase({ cadastrosTasy: cadastrosLocais });
    }

    fecharModalCadastroRapido();
    renderizarTabelasCadastros();

    abrirEExecutarConversaoTasy();
    mostrarNotificacaoToast("Item cadastrado e convertido com sucesso!");
}

// ----------------------------------------------------------------------
// ALTERNAR ENTRE MODO UNITÁRIO E MODO UNIVERSAL
// ----------------------------------------------------------------------
function alternarModoCadastro(tipo) {
    const formUnitario = document.getElementById('cadastroForm');
    const blocoMassa = document.getElementById('blocoCadastroMassa');

    if (tipo === 'unitario') {
        formUnitario.style.display = 'block';
        blocoMassa.style.display = 'none';
    } else {
        formUnitario.style.display = 'none';
        blocoMassa.style.display = 'block';
    }
}

// ----------------------------------------------------------------------
// PRÉ-VISUALIZAÇÃO E PROCESSAMENTO DO CADASTRO UNIVERSAL
// ----------------------------------------------------------------------
function abrirPreviaCadastroMassa() {
    const codFornText = document.getElementById('textMassCodForn').value.trim();
    const descFornText = document.getElementById('textMassDescForn').value.trim();
    const codTasyText = document.getElementById('textMassCodTasy').value.trim();
    const descTasyText = document.getElementById('textMassDescTasy').value.trim();

    if (!codFornText || !descFornText || !codTasyText || !descTasyText) {
        alert("Preencha todos os campos de código e descrição de ambos os lados para prosseguir.");
        return;
    }

    const codsForn = codFornText.split('\n').map(l => l.trim()).filter(l => l !== '');
    const descsForn = descFornText.split('\n').map(l => l.trim()).filter(l => l !== '');
    const codsTasy = codTasyText.split('\n').map(l => l.trim()).filter(l => l !== '');
    const descsTasy = descTasyText.split('\n').map(l => l.trim()).filter(l => l !== '');

    const totalLinhas = Math.max(codsForn.length, descsForn.length, codsTasy.length, descsTasy.length);

    if (codsForn.length !== totalLinhas || descsForn.length !== totalLinhas || codsTasy.length !== totalLinhas || descsTasy.length !== totalLinhas) {
        alert("A quantidade de linhas entre os campos (códigos e descrições) difere. Verifique se todas as colunas possuem a mesma quantidade de linhas.");
        return;
    }

    itensPreviaMassaTemporarios = [];

    for (let i = 0; i < totalLinhas; i++) {
        itensPreviaMassaTemporarios.push({
            codForn: codsForn[i] || '',
            descForn: descsForn[i] || '',
            codTasy: codsTasy[i] || '',
            descTasy: descsTasy[i] || ''
        });
    }

    renderizarTabelaPreviaMassa();
    const modal = document.getElementById('modalPreviaMassa');
    if (modal) modal.classList.add('show');
}

function fecharModalPreviaMassa() {
    const modal = document.getElementById('modalPreviaMassa');
    if (modal) modal.classList.remove('show');
}

function renderizarTabelaPreviaMassa() {
    const tbody = document.getElementById('tabelaPreviaMassaBody');
    if (!tbody) return;

    tbody.innerHTML = itensPreviaMassaTemporarios.map(item => `
        <tr>
            <td><strong>${item.codForn}</strong></td>
            <td>${item.descForn}</td>
            <td><strong>${item.codTasy}</strong></td>
            <td>${item.descTasy}</td>
        </tr>
    `).join('');
}

function confirmarSalvarMassaDefinitivo() {
    if (itensPreviaMassaTemporarios.length === 0) return;

    let novosAdicionados = 0;

    itensPreviaMassaTemporarios.forEach(item => {
        if (item.codForn && item.descForn && item.codTasy && item.descTasy) {
            const existente = cadastrosLocais.find(c => String(c.codForn).trim().toLowerCase() === item.codForn.toLowerCase());
            if (existente) {
                existente.codTasy = item.codTasy;
                existente.descTasy = item.descTasy;
            } else {
                cadastrosLocais.push({
                    id: Date.now() + Math.random(),
                    codForn: item.codForn,
                    descForn: item.descForn,
                    codTasy: item.codTasy,
                    descTasy: item.descTasy
                });
            }
            novosAdicionados++;
        }
    });

    if (novosAdicionados > 0) {
        localStorage.setItem('opm_cadastros_tasy', JSON.stringify(cadastrosLocais));

        if (typeof window.syncWorkCreateFirebase === "function") {
            window.syncWorkCreateFirebase({ cadastrosTasy: cadastrosLocais });
        }

        // Limpa os textareas
        document.getElementById('textMassCodForn').value = '';
        document.getElementById('textMassDescForn').value = '';
        document.getElementById('textMassCodTasy').value = '';
        document.getElementById('textMassDescTasy').value = '';

        fecharModalPreviaMassa();
        renderizarTabelasCadastros();
        mostrarNotificacaoToast(`${novosAdicionados} ${novosAdicionados === 1 ? 'item cadastrado' : 'itens cadastrados'} com sucesso!`);
    } else {
        alert("Nenhum item válido para salvar.");
    }
}

function ativarModoEditar() {
    modoAtual = 'editar';
    atualizarVisibilidadeModos();
    renderizarTabelasCadastros();
}

function ativarModoExcluir() {
    modoAtual = 'excluir';
    itensSelecionadosExcluir.clear();
    atualizarVisibilidadeModos();
    renderizarTabelasCadastros();
}

function desativarModosSelecao() {
    modoAtual = 'normal';
    itensSelecionadosExcluir.clear();
    atualizarVisibilidadeModos();
    renderizarTabelasCadastros();
}

function atualizarVisibilidadeModos() {
    const btnModoEditar = document.getElementById('btnModoEditar');
    const btnModoExcluir = document.getElementById('btnModoExcluir');
    const btnCancelarEditar = document.getElementById('btnCancelarModoEditar');
    const btnConfirmarExcluir = document.getElementById('btnConfirmarExcluirMassa');
    const btnCancelarExcluir = document.getElementById('btnCancelarModoExcluir');
    const colHeaders = document.querySelectorAll('.col-select-header');

    if (modoAtual === 'editar') {
        btnModoEditar.style.display = 'none';
        btnModoExcluir.style.display = 'none';
        btnCancelarEditar.style.display = 'none';
        btnConfirmarExcluir.style.display = 'none';
        btnCancelarExcluir.style.display = 'none';
        colHeaders.forEach(th => th.style.display = 'table-cell');
    } else if (modoAtual === 'excluir') {
        btnModoEditar.style.display = 'none';
        btnModoExcluir.style.display = 'none';
        btnCancelarEditar.style.display = 'none';
        btnConfirmarExcluir.style.display = 'inline-flex';
        btnCancelarExcluir.style.display = 'inline-flex';
        colHeaders.forEach(th => th.style.display = 'table-cell');
    } else {
        btnModoEditar.style.display = 'inline-flex';
        btnModoExcluir.style.display = 'inline-flex';
        btnCancelarEditar.style.display = 'none';
        btnConfirmarExcluir.style.display = 'none';
        btnCancelarExcluir.style.display = 'none';
        colHeaders.forEach(th => th.style.display = 'none');
    }
}

function toggleSelecionarTodosCadastros(isChecked) {
    itensSelecionadosExcluir.clear();
    const termo = (document.getElementById('globalSearchInput')?.value || '').toLowerCase();
    let filtrados = cadastrosLocais.filter(item => 
        String(item.codForn).toLowerCase().includes(termo) ||
        String(item.descForn).toLowerCase().includes(termo) ||
        String(item.codTasy).toLowerCase().includes(termo) ||
        String(item.descTasy).toLowerCase().includes(termo)
    );

    if (isChecked) {
        filtrados.forEach(item => itensSelecionadosExcluir.add(String(item.id)));
    }
    renderizarTabelasCadastros();
}

function toggleSelecaoExcluir(id) {
    const strId = String(id);
    if (itensSelecionadosExcluir.has(strId)) {
        itensSelecionadosExcluir.delete(strId);
    } else {
        itensSelecionadosExcluir.add(strId);
    }
    
    const termo = (document.getElementById('globalSearchInput')?.value || '').toLowerCase();
    let filtrados = cadastrosLocais.filter(item => 
        String(item.codForn).toLowerCase().includes(termo) ||
        String(item.descForn).toLowerCase().includes(termo) ||
        String(item.codTasy).toLowerCase().includes(termo) ||
        String(item.descTasy).toLowerCase().includes(termo)
    );
    const todosMarcados = filtrados.length > 0 && filtrados.every(item => itensSelecionadosExcluir.has(String(item.id)));
    
    const chkForn = document.getElementById('selectAllForn');
    const chkTasy = document.getElementById('selectAllTasy');
    if (chkForn) chkForn.checked = todosMarcados;
    if (chkTasy) chkTasy.checked = todosMarcados;

    renderizarTabelasCadastros();
}

function selecionarParaEditar(id) {
    editarCadastro(id);
    desativarModosSelecao();
}

function salvarCadastro(e) {
    if (e && e.preventDefault) e.preventDefault();

    const idEdit = document.getElementById('editCadastroId').value;
    const codForn = document.getElementById('inputCodFornecedor').value.trim();
    const descForn = document.getElementById('inputDescFornecedor').value.trim();
    const codTasy = document.getElementById('inputCodTasy').value.trim();
    const descTasy = document.getElementById('inputDescTasy').value.trim();

    if (!codForn || !descForn || !codTasy || !descTasy) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    if (idEdit) {
        cadastrosLocais = cadastrosLocais.map(item => {
            if (String(item.id) === String(idEdit)) {
                return { ...item, codForn, descForn, codTasy, descTasy };
            }
            return item;
        });
        mostrarNotificacaoToast("Cadastro atualizado com sucesso!");
    } else {
        const novoItem = { id: Date.now(), codForn, descForn, codTasy, descTasy };
        cadastrosLocais.push(novoItem);
        idSelecionadoGlobal = novoItem.id;
        mostrarNotificacaoToast("Cadastro salvo com sucesso!");
    }

    localStorage.setItem('opm_cadastros_tasy', JSON.stringify(cadastrosLocais));

    if (typeof window.syncWorkCreateFirebase === "function") {
        window.syncWorkCreateFirebase({ cadastrosTasy: cadastrosLocais });
    }

    cancelarEdicaoCadastro();
    renderizarTabelasCadastros();
}

function filtrarCadastrosGlobais() {
    renderizarTabelasCadastros();
}

function renderizarTabelasCadastros() {
    const tbodyForn = document.getElementById('tabelaFornecedorBody');
    const tbodyTasy = document.getElementById('tabelaTasyBody');
    if (!tbodyForn || !tbodyTasy) return;

    const termo = (document.getElementById('globalSearchInput')?.value || '').toLowerCase();
    const tipoFiltro = document.getElementById('filterOrdenacao')?.value || 'todos';

    let filtrados = cadastrosLocais.filter(item => 
        String(item.codForn).toLowerCase().includes(termo) ||
        String(item.descForn).toLowerCase().includes(termo) ||
        String(item.codTasy).toLowerCase().includes(termo) ||
        String(item.descTasy).toLowerCase().includes(termo)
    );

    if (tipoFiltro === 'az') {
        filtrados.sort((a, b) => a.descForn.localeCompare(b.descForn, 'pt-BR', { sensitivity: 'base' }));
    } else if (tipoFiltro === 'cod_crescente') {
        filtrados.sort((a, b) => {
            const numA = parseFloat(a.codForn) || 0;
            const numB = parseFloat(b.codForn) || 0;
            return numA !== numB ? numA - numB : a.codForn.localeCompare(b.codForn, undefined, { numeric: true });
        });
    } else if (tipoFiltro === 'cod_decrescente') {
        filtrados.sort((a, b) => {
            const numA = parseFloat(a.codForn) || 0;
            const numB = parseFloat(b.codForn) || 0;
            return numA !== numB ? numB - numA : b.codForn.localeCompare(a.codForn, undefined, { numeric: true });
        });
    }

    const todosMarcados = filtrados.length > 0 && filtrados.every(item => itensSelecionadosExcluir.has(String(item.id)));
    const chkForn = document.getElementById('selectAllForn');
    const chkTasy = document.getElementById('selectAllTasy');
    if (chkForn) chkForn.checked = todosMarcados;
    if (chkTasy) chkTasy.checked = todosMarcados;

    tbodyForn.innerHTML = '';
    tbodyTasy.innerHTML = '';

    const colSpan = modoAtual !== 'normal' ? 3 : 2;

    if (filtrados.length === 0) {
        tbodyForn.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 20px; color: var(--text-muted);">Nenhum cadastro encontrado.</td></tr>`;
        tbodyTasy.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 20px; color: var(--text-muted);">Nenhum cadastro encontrado.</td></tr>`;
        return;
    }

    filtrados.forEach(item => {
        const strId = String(item.id);
        const isSelected = strId === String(idSelecionadoGlobal);
        const isCheckedExcluir = itensSelecionadosExcluir.has(strId);
        const selectedClass = isSelected ? 'selected-row' : '';

        const rowIdForn = `row-forn-${item.id}`;
        const rowIdTasy = `row-tasy-${item.id}`;

        // ----------------------------------------------------------------------
        // TABELA FORNECEDOR
        // ----------------------------------------------------------------------
        const trForn = document.createElement('tr');
        trForn.id = rowIdForn;
        trForn.className = selectedClass;
        trForn.onclick = () => {
            if (modoAtual === 'excluir') {
                toggleSelecaoExcluir(item.id);
            } else if (modoAtual === 'editar') {
                selecionarParaEditar(item.id);
            } else {
                selecionarItemSincronizado(item.id, 'forn');
            }
        };

        let colSelectFornHtml = '';
        if (modoAtual === 'editar') {
            colSelectFornHtml = `<td class="col-select-cell"><input type="radio" name="radioEditar" class="cell-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); selecionarParaEditar('${item.id}')"></td>`;
        } else if (modoAtual === 'excluir') {
            colSelectFornHtml = `<td class="col-select-cell"><input type="checkbox" class="cell-checkbox" ${isCheckedExcluir ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelecaoExcluir('${item.id}')"></td>`;
        }

        trForn.innerHTML = `
            ${colSelectFornHtml}
            <td><strong>${item.codForn}</strong></td>
            <td><div class="descricao-celula" onclick="event.stopPropagation(); toggleExpandDesc(this)" title="Clique para expandir">${item.descForn}</div></td>
        `;
        tbodyForn.appendChild(trForn);

        // ----------------------------------------------------------------------
        // TABELA TASY
        // ----------------------------------------------------------------------
        const trTasy = document.createElement('tr');
        trTasy.id = rowIdTasy;
        trTasy.className = selectedClass;
        trTasy.onclick = () => {
            if (modoAtual === 'excluir') {
                toggleSelecaoExcluir(item.id);
            } else if (modoAtual === 'editar') {
                selecionarParaEditar(item.id);
            } else {
                selecionarItemSincronizado(item.id, 'tasy');
            }
        };

        let colSelectTasyHtml = '';
        if (modoAtual === 'editar') {
            colSelectTasyHtml = `<td class="col-select-cell"><input type="radio" name="radioEditarTasy" class="cell-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); selecionarParaEditar('${item.id}')"></td>`;
        } else if (modoAtual === 'excluir') {
            colSelectTasyHtml = `<td class="col-select-cell"><input type="checkbox" class="cell-checkbox" ${isCheckedExcluir ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelecaoExcluir('${item.id}')"></td>`;
        }

        trTasy.innerHTML = `
            ${colSelectTasyHtml}
            <td><strong>${item.codTasy}</strong></td>
            <td><div class="descricao-celula" onclick="event.stopPropagation(); toggleExpandDesc(this)" title="Clique para expandir">${item.descTasy}</div></td>
        `;
        tbodyTasy.appendChild(trTasy);
    });
}

function selecionarItemSincronizado(id, origem) {
    idSelecionadoGlobal = id;

    document.querySelectorAll('.custom-data-table tr').forEach(tr => {
        tr.classList.remove('selected-row');
    });

    const elForn = document.getElementById(`row-forn-${id}`);
    const elTasy = document.getElementById(`row-tasy-${id}`);

    if (elForn) elForn.classList.add('selected-row');
    if (elTasy) elTasy.classList.add('selected-row');

    if (origem === 'forn' && elTasy) {
        elTasy.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (origem === 'tasy' && elForn) {
        elForn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function toggleExpandDesc(element) {
    element.classList.toggle('expanded');
}

function editarCadastro(id) {
    const item = cadastrosLocais.find(i => String(i.id) === String(id));
    if (!item) return;

    document.querySelector('input[name="tipoModoCadastro"][value="unitario"]').checked = true;
    alternarModoCadastro('unitario');

    document.getElementById('editCadastroId').value = item.id;
    document.getElementById('inputCodFornecedor').value = item.codForn;
    document.getElementById('inputDescFornecedor').value = item.descForn;
    document.getElementById('inputCodTasy').value = item.codTasy;
    document.getElementById('inputDescTasy').value = item.descTasy;

    document.getElementById('formCadastroTitle').innerText = "Editar Cadastro / Equivalência";
    document.getElementById('btnSalvarCadastro').innerHTML = `<i class="fa-solid fa-check"></i> Atualizar Cadastro`;
    document.getElementById('btnCancelarEdicao').style.display = 'inline-flex';

    const contentArea = document.querySelector('.content-area-full');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicaoCadastro() {
    document.getElementById('cadastroForm').reset();
    document.getElementById('editCadastroId').value = '';
    document.getElementById('formCadastroTitle').innerText = "Novo Cadastro / Equivalência";
    document.getElementById('btnSalvarCadastro').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Cadastro`;
    document.getElementById('btnCancelarEdicao').style.display = 'none';
}

function solicitarConfirmacaoExclusao() {
    const qtd = itensSelecionadosExcluir.size;
    if (qtd === 0) {
        alert("Selecione pelo menos um item para excluir.");
        return;
    }

    const textoModal = document.getElementById('modalExcluirTexto');
    if (textoModal) {
        textoModal.innerText = `Deseja realmente excluir ${qtd} ${qtd === 1 ? 'item' : 'itens'} da lista?`;
    }

    const modal = document.getElementById('modalConfirmExcluir');
    if (modal) modal.classList.add('show');
}

function fecharModalExcluir() {
    const modal = document.getElementById('modalConfirmExcluir');
    if (modal) modal.classList.remove('show');
}

function confirmarExclusaoEmMassa() {
    fecharModalExcluir();

    cadastrosLocais = cadastrosLocais.filter(item => !itensSelecionadosExcluir.has(String(item.id)));
    if (itensSelecionadosExcluir.has(String(idSelecionadoGlobal))) {
        idSelecionadoGlobal = null;
    }

    localStorage.setItem('opm_cadastros_tasy', JSON.stringify(cadastrosLocais));

    if (typeof window.syncWorkCreateFirebase === "function") {
        window.syncWorkCreateFirebase({ cadastrosTasy: cadastrosLocais });
    }

    const qtdExcluidos = itensSelecionadosExcluir.size;
    desativarModosSelecao();
    mostrarNotificacaoToast(`${qtdExcluidos} ${qtdExcluidos === 1 ? 'item excluído' : 'itens excluídos'} com sucesso!`);
}

function mostrarNotificacaoToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    const msgSpan = document.getElementById('toast-msg');
    if (msgSpan) msgSpan.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}