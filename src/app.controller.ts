import { Controller, Get, Res, HttpStatus, BadRequestException, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('demonstrativoArrecadacao/:cidade/:estado')
  async getDemonstrativoArrecadacao(@Param('cidade') cidade: string, @Param('estado') estado: string,
                                    @Query('dataInicial') dataI: string, @Query('dataFinal') dataF: string, @Res() res) {
    return this.appService.returnDemonstrativoArrecadacao(cidade, estado, dataI, dataF)
      .then(fundos => res.status(HttpStatus.OK).json({
          message: `Consulta realizada no beneficiário ${cidade} - ${estado}`,
          data: { fundos: fundos[0], fundosResumo: fundos[1] } }) )
      .catch(err => new BadRequestException(err, 'Error ao realizar consulta') );
  }
}
