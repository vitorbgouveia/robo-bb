import { Injectable, BadRequestException } from '@nestjs/common';
import puppeteer = require('puppeteer');

@Injectable()
export class AppService {
  newParcelas = [];

  getHello(): string {
    return 'Hello World!';
  }

  async returnDemonstrativoArrecadacao(cidade, estado, dataI, dataF) {
    const retry = (fn, ms) => new Promise(resolve => {
      fn()
        .then(resolve)
        .catch(() => {
          setTimeout(() => {
            retry(fn, ms).then(resolve);
          }, ms);
        })
    });

    cidade = this.trataCaracter(cidade);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const response = await retry(() => this.executeRoboBb(page, cidade, estado, dataI, dataF), 1000);
    await browser.close();

    return this.returnFundos(response);
  }

  async executeRoboBb(page, cidade: string, siglaEstado: string, dataI: string, dataF: string) {
    try {
      await page.goto(`https://www42.bb.com.br/portalbb/daf/beneficiario,802,4647,4652,0,1.bbx`, {timeout: 10000});
      await page.waitFor('.bt_prin');
      await page.$eval('input[id="formulario:j_id34:nome"]', (el, value) => el.value = value, cidade.toLowerCase());

      const button = await page.$('input[id="formulario:botaoBuscar"]');
      await button.click();

      await page.waitFor('.field.s12');

      const cidadeFormated = `${cidade.toUpperCase()} - ${siglaEstado.toUpperCase()}`
      const valueCidade = await page.$eval('select[id="formulario:j_id34:comboBeneficiario"]', (select, cidade) => {
        for (const option of select['options']) {
          if (option['innerText'] == cidade) {
            return option['value'];
          }
        }
      }, cidadeFormated);
      await page.$eval('select[id="formulario:j_id34:comboBeneficiario"]', (el, value) => el.value = value, valueCidade);
      await page.$eval('input[id="formulario:j_id44:dataInicialInputDate"]', (el, value) => el.value = value, dataI || this.getNowDate());
      await page.$eval('input[id="formulario:j_id54:dataFinalInputDate"]', (el, value) => el.value = value, dataF || this.getNowDate());

      const buttonConsulta = await page.$('input[id="formulario:botaoContinuar"]');
      await buttonConsulta.click();

      await page.waitFor('.bt_prin');

      const titulos = await page.evaluate(() => {
        const elements =  document.querySelectorAll('.rich-table-cell');
        const titulos = [];
        for (const element of elements) {
          titulos.push(element['innerText']);
        }
        return titulos.splice(1, titulos.length);
      });

      const datas = await page.evaluate(() => {
        const elements =  document.querySelectorAll('.rich-subtable-cell.texto');
        const datas = [];
        for (const element of elements) {
          datas.push(element['innerText']);
        }
        return datas.splice(2, datas.length);
      });

      const parcelas = await page.evaluate(() => {
        const elements =  document.querySelectorAll('.rich-subtable-cell.texto1');
        const parcelas = [];
        for (const element of elements) {
          parcelas.push(element['innerText']);
        }
        return parcelas.splice(2, parcelas.length);
      });

      const valores = await page.evaluate(() => {
        const elements =  document.querySelectorAll('.rich-subtable-cell.extratoValorPositivoAlinhaDireita');
        const valores = [];
        for (const element of elements) {
          valores.push(element['innerText']);
        }
        return valores.splice(2, valores.length);
      });

      return {titulos, datas, parcelas, valores}
    } catch(err) {
      throw new BadRequestException(err, 'Não foi possível realizar esta operação')
    }
  }

  returnFundos(result) {
    const parcelasFormatadas = [];
    const datas = [];
    let data: string;
    result.parcelas.map((parcela, index) => {
      data = result.datas[index] && result.datas[index] !== 'TOTAIS' ? `${result.datas[index]}` : data;
      if (!parcela) { data = ''; }
      if (data && !datas.includes(data)) { datas.push(data); }
      parcelasFormatadas.push(`${data}${parcela}${result.valores[index]}`);
    });

    let fundos = [];
    result.titulos.map(titulo => fundos.push({
      nome: titulo,
      parcelas: this.organizaParcelas(parcelasFormatadas) 
    }));
    this.newParcelas = [];

    fundos = this.formatParcelasPorData(fundos, datas);
    fundos = this.ordenaPorData(fundos);
    return [fundos, this.returnFundosResume(fundos)];
  }

  formatParcelasPorData(fundos, datas) {
    fundos.map(fundo => {
      const parcelasFormatadas = [];
      const parcelasComData = [];
      fundo.parcelas.map(parcela => {
        if ( parcela.nome.length > 10 && datas.filter(data => data === parcela.nome.substr(0, 10)).length > 0 ) {
          parcela['data'] = parcela.nome.substr(0, 10);
          parcela.nome = parcela.nome.substr(10, parcela.length);
          parcelasComData.push(parcela);
          return;
        }
        parcelasFormatadas.push(parcela);
      });

      datas.map(data => {
        if (parcelasComData.filter(parcela => parcela.data === data).length > 0) {
          parcelasFormatadas.unshift({ data, parcelas: parcelasComData.filter(parcela => parcela.data === data) });
        }
      });

      parcelasFormatadas.map(parcelaFormatada => {
        if (parcelaFormatada.parcelas) {
          parcelaFormatada.parcelas.map(parcela => delete parcela.data);
        }
      });

      fundo.parcelas = parcelasFormatadas;
    });
    return fundos;
  }

  returnFundosResume(fundos) {
    const resumeFundos = [];
    fundos.map(fundo => {
      const parcelasComData = [];
      fundo.parcelas.map(parcela => parcela.data ? parcelasComData.push.apply(parcelasComData, parcela.parcelas) : null );
      const resumeParcelas = [];
      fundo.parcelas.map(parcela => {
        if (parcela.data) { 
          resumeParcelas.push(parcela);
          return;
        }
        const existeParcela = parcelasComData.filter(p =>
          p.nome === parcela.nome && p.valor === parcela.valor && p.natureza === parcela.natureza).length > 0;
        if (!existeParcela) resumeParcelas.push(parcela);
      });
      resumeParcelas.push.apply(parcelasComData, resumeParcelas);
      resumeFundos.push({nome: fundo.nome, parcelas: resumeParcelas});
    });
    return resumeFundos;
  }

  ordenaPorData(fundos) {
    const newFundos = [];
    fundos.map(fundo => {
      const newParcelas = [];
      fundo.parcelas.map(parcela => {
        if (newParcelas.length === 0 && parcela.data) {
          newParcelas.push(parcela);
          return;
        }

        if (parcela.data) {
          const dataParcela0 = Number(newParcelas[0].data.substr(0, 2));
          const dataParcelaAtual = Number(parcela.data.substr(0, 2));
          if (dataParcela0 > dataParcelaAtual) {
            newParcelas.unshift(parcela);
            return;
          }
        }
        newParcelas.push(parcela);
      });
      newFundos.push({nome: fundo.nome, parcelas: newParcelas});
    });
    return newFundos;
  }

  organizaParcelas(parcelas): any {
    const parcelasFundo = [];
    parcelas = this.newParcelas.length > 0 ? this.newParcelas : parcelas;
    let i = -1;
    for (let parcela of parcelas) {
      i ++;
      if (parcela == '' && parcelas[i - 1] == '') {
        this.newParcelas = parcelas.splice(i + 1, parcelas.length);
        return parcelasFundo;
      }
      parcela = this.trataParcela(parcela);
      if (parcela) parcelasFundo.push(parcela);
    }
    return parcelasFundo;
  }

  trataParcela(parcela) {
    if (!parcela) { return; }
    const parcelaValor = parcela.split('R$ ');
    let valor = (parcelaValor[1].replace('.', '')).replace(',', '.');
    valor = valor.substr(0 , valor.length - 2)
    return { nome: parcelaValor[0], valor, natureza: parcelaValor[1].substr(-1) };
  }

  trataCaracter(label: string): string {
    label = label.replace(/[áàãâä]/ui, 'a');
    label = label.replace(/[éèêë]/ui, 'e');
    label = label.replace(/[íìîï]/ui, 'i');
    label = label.replace(/[óòõôö]/ui, 'o');
    label = label.replace(/[úùûü]/ui, 'u');
    label = label.replace(/[ç]/ui, 'c');
    return label;
  }

  getNowDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
