<template>
  <div class="q-pa-sm">
    <q-card class="q-my-md filter-card">
      <q-card-section class="row justify-between items-center">
        <div class="col-12 justify-center flex q-gutter-sm">
          <q-datetime-picker
            style="width: 200px"
            dense
            rounded
            hide-bottom-space
            outlined
            stack-label
            bottom-slots
            label="Data Inicial"
            mode="date"
            color="primary"
            format24h
            v-model="params.startDate"
          />
          <q-datetime-picker
            style="width: 200px"
            dense
            rounded
            hide-bottom-space
            outlined
            stack-label
            bottom-slots
            label="Data Final"
            mode="date"
            color="primary"
            format24h
            v-model="params.endDate"
          />
          <q-btn
            rounded
            color="primary"
            flat
            label="Hoje"
            @click="setToday"
          />
          <q-select
            style="width: 300px"
            dense
            rounded
            outlined
            hide-bottom-space
            emit-value
            map-options
            multiple
            options-dense
            use-chips
            label="Filas"
            color="primary"
            v-model="params.queuesIds"
            :options="filas"
            :input-debounce="700"
            option-value="id"
            option-label="queue"
            input-style="width: 280px; max-width: 280px;"
          />
          <q-btn
            rounded
            color="primary"
            icon="refresh"
            label="Atualizar"
            @click="getDashData"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-my-md metrics-card">
      <q-card-section class="q-pa-md">
        <div class="row q-gutter-md justify-center">
          <div class="col-xs-12 col-sm-shrink">
            <q-card
              flat
              bordered
              class="my-card full-height metric-card-item"
              style="min-width: 200px"
            >
              <q-card-section class="text-center">
                <q-icon name="mdi-account-group" size="2em" color="primary" class="q-mb-sm"/>
                <p class="text-h4 text-bold text-center text-primary"> {{ ticketsAndTimes.qtd_total_atendimentos }} </p>
                <div class="text-subtitle1">Total Atendimentos</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-shrink">
            <q-card
              flat
              bordered
              class="my-card full-height metric-card-item"
              style="min-width: 200px"
            >
              <q-card-section class="text-center">
                <q-icon name="mdi-clock-check" size="2em" color="positive" class="q-mb-sm"/>
                <p class="text-h4 text-bold text-center text-positive"> {{ ticketsAndTimes.qtd_demanda_ativa }} </p>
                <div class="text-subtitle1">Ativo</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-shrink">
            <q-card
              flat
              bordered
              class="my-card full-height metric-card-item"
              style="min-width: 200px"
            >
              <q-card-section class="text-center">
                <q-icon name="mdi-clock-outline" size="2em" color="info" class="q-mb-sm"/>
                <p class="text-h4 text-bold text-center text-info"> {{ ticketsAndTimes.qtd_demanda_receptiva }} </p>
                <div class="text-subtitle1">Receptivo</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-shrink">
            <q-card
              flat
              bordered
              class="my-card full-height metric-card-item"
              style="min-width: 200px"
            >
              <q-card-section class="text-center">
                <q-icon name="mdi-account-plus" size="2em" color="warning" class="q-mb-sm"/>
                <p class="text-h4 text-bold text-center text-warning"> {{ ticketsAndTimes.new_contacts }} </p>
                <div class="text-subtitle1">Novos Contatos</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2">
            <q-card
              flat
              bordered
              class="my-card full-height metric-card-item"
            >
              <q-card-section class="text-center">
                <q-icon name="mdi-timer" size="2em" color="secondary" class="q-mb-sm"/>
                <p class="text-h5 text-bold text-center text-secondary"> {{ cTmaFormat }} </p>
                <div class="text-subtitle1">Tempo Médio Atendimento</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2">
            <q-card
              flat
              bordered
              class="my-card full-height metric-card-item"
            >
              <q-card-section class="text-center">
                <q-icon name="mdi-timer-outline" size="2em" color="accent" class="q-mb-sm"/>
                <p class="text-h5 text-bold text-center text-accent"> {{ cTmeFormat }} </p>
                <div class="text-subtitle1">Tempo Médio 1º Resposta</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <div class="col-xs-12 col-sm-6">
        <q-card class="chart-card">
          <q-card-section class="q-pa-md">
            <div class="text-h6 q-mb-md">Distribuição por Canais</div>
            <ApexChart
              ref="ChartTicketsChannels"
              type="donut"
              height="300"
              width="100%"
              :options="ticketsChannelsOptions"
              :series="ticketsChannelsOptions.series"
            />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-xs-12 col-sm-6">
        <q-card class="chart-card">
          <q-card-section class="q-pa-md">
            <div class="text-h6 q-mb-md">Distribuição por Filas</div>
            <ApexChart
              ref="ChartTicketsQueue"
              type="donut"
              height="300"
              width="100%"
              :options="ticketsQueueOptions"
              :series="ticketsQueueOptions.series"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-card class="q-my-md chart-card">
      <q-card-section class="q-pa-md">
        <div class="text-h6 q-mb-md">Evolução por Canais</div>
        <ApexChart
          ref="ChartTicketsEvolutionChannels"
          type="area"
          height="300"
          width="100%"
          :options="ticketsEvolutionChannelsOptions"
          :series="ticketsEvolutionChannelsOptions.series"
        />
      </q-card-section>
    </q-card>
    <q-card class="q-my-md chart-card">
      <q-card-section class="q-pa-md">
        <div class="text-h6 q-mb-md">Evolução por Período</div>
        <ApexChart
          ref="ChartTicketsEvolutionByPeriod"
          type="line"
          height="300"
          :options="ticketsEvolutionByPeriodOptions"
          :series="ticketsEvolutionByPeriodOptions.series"
        />
      </q-card-section>
    </q-card>

    <q-card class="q-my-md q-pa-sm performance-card">
      <q-card-section class="q-pa-md">
        <div class="text-h6 q-mb-md">Performance dos Usuários</div>
        <q-table
          :data="ticketsPerUsersDetail"
          :columns="TicketsPerUsersDetailColumn"
          row-key="email"
          :pagination.sync="paginationTableUser"
          :rows-per-page-options="[0]"
          bordered
          flat
          hide-bottom
          class="performance-table"
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-avatar size="32px" class="q-mr-sm">
                  {{ props.row.name ? props.row.name.charAt(0).toUpperCase() : 'N' }}
                </q-avatar>
                <div>
                  <div class="text-bold">{{ props.row.name || 'Não informado' }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.email }}</div>
                </div>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

  </div>
</template>

<script>
import { groupBy } from 'lodash'
import { ListarFilas } from 'src/service/filas'
import {
  GetDashTicketsAndTimes,
  GetDashTicketsChannels,
  GetDashTicketsEvolutionChannels,
  GetDashTicketsQueue,
  GetDashTicketsEvolutionByPeriod,
  GetDashTicketsPerUsersDetail
} from 'src/service/estatisticas'
import { subDays, format, formatDuration, differenceInDays } from 'date-fns'
import ApexChart from 'vue-apexcharts'

export default {
  name: 'IndexDashboard',
  components: { ApexChart },
  data () {
    const isDark = this.$q.dark.isActive
    const textColor = isDark ? '#fff' : '#373d3f'
    const gridColor = isDark ? '#404040' : '#e7e7e7'

    // Paleta de cores moderna e vibrante
    const modernColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

    // Função auxiliar para clarear cores
    const lightenColor = (color, amount) => {
      const num = parseInt(color.replace('#', ''), 16)
      const r = Math.min(255, (num >> 16) + amount)
      const b = Math.min(255, ((num >> 8) & 0x00FF) + amount)
      const g = Math.min(255, (num & 0x0000FF) + amount)
      return '#' + (g | (b << 8) | (r << 16)).toString(16)
    }

    // Configurações comuns para todos os gráficos
    const commonOptions = {
      chart: {
        background: 'transparent',
        foreColor: textColor,
        toolbar: {
          show: true,
          tools: {
            download: false
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 3,
          left: 2,
          blur: 4,
          opacity: 0.1
        }
      },
      theme: {
        mode: isDark ? 'dark' : 'light',
        palette: 'palette1'
      },
      colors: modernColors,
      stroke: {
        curve: 'smooth',
        width: 3
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'bold',
          colors: [textColor]
        },
        background: {
          enabled: true,
          foreColor: textColor,
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: gridColor,
          opacity: 0.9
        },
        offsetY: -10,
        formatter: function (val) {
          return val
        }
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        markers: {
          width: 12,
          height: 12,
          radius: 6
        },
        itemMargin: {
          horizontal: 15,
          vertical: 5
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        }
      },
      tooltip: {
        enabled: true,
        theme: isDark ? 'dark' : 'light',
        style: {
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif'
        },
        x: {
          show: true
        },
        y: {
          formatter: function (val) {
            return val + ' atendimentos'
          }
        },
        marker: {
          show: true
        }
      }
    }

    return {
      confiWidth: {
        horizontal: false,
        width: this.$q.screen.width
      },
      params: {
        startDate: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        queuesIds: []
      },
      paginationTableUser: {
        rowsPerPage: 40,
        rowsNumber: 0,
        lastIndex: 0
      },
      filas: [],
      ticketsChannels: [],
      ticketsChannelsOptions: {
        ...commonOptions,
        chart: {
          ...commonOptions.chart,
          type: 'donut'
        },
        plotOptions: {
          pie: {
            donut: {
              size: '75%',
              background: 'transparent',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: textColor,
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: '24px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: textColor,
                  offsetY: 10
                },
                total: {
                  show: true,
                  label: 'Total',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: textColor
                }
              }
            }
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: isDark ? 'dark' : 'light',
            type: 'vertical',
            shadeIntensity: 0.5,
            gradientToColors: modernColors.map(color => lightenColor(color, 20)),
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 90, 100]
          }
        }
      },
      ticketsQueue: [],
      ticketsQueueOptions: {
        ...commonOptions,
        chart: {
          ...commonOptions.chart,
          type: 'donut'
        },
        plotOptions: {
          pie: {
            donut: {
              size: '75%',
              background: 'transparent',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: textColor,
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: '24px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: textColor,
                  offsetY: 10
                },
                total: {
                  show: true,
                  label: 'Total',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: textColor
                }
              }
            }
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: isDark ? 'dark' : 'light',
            type: 'vertical',
            shadeIntensity: 0.5,
            gradientToColors: modernColors.map(color => lightenColor(color, 20)),
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 90, 100]
          }
        }
      },
      ticketsEvolutionChannels: [],
      ticketsEvolutionChannelsOptions: {
        ...commonOptions,
        chart: {
          ...commonOptions.chart,
          type: 'area',
          stacked: false,
          zoom: {
            enabled: true,
            type: 'x'
          }
        },
        grid: {
          show: true,
          borderColor: gridColor,
          strokeDashArray: 5,
          position: 'back',
          xaxis: {
            lines: {
              show: true
            }
          },
          yaxis: {
            lines: {
              show: true
            }
          },
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 10
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: isDark ? 'dark' : 'light',
            type: 'vertical',
            shadeIntensity: 0.5,
            gradientToColors: modernColors,
            inverseColors: false,
            opacityFrom: 0.8,
            opacityTo: 0.2,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          type: 'category',
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              colors: textColor
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              colors: textColor
            }
          }
        }
      },
      ticketsEvolutionByPeriod: [],
      ticketsEvolutionByPeriodOptions: {
        ...commonOptions,
        chart: {
          ...commonOptions.chart,
          type: 'line',
          zoom: {
            enabled: true,
            type: 'x'
          }
        },
        stroke: {
          curve: 'smooth',
          width: 4
        },
        markers: {
          size: 6,
          strokeWidth: 0,
          hover: {
            size: 9
          }
        },
        grid: {
          show: true,
          borderColor: gridColor,
          strokeDashArray: 5,
          position: 'back',
          xaxis: {
            lines: {
              show: true
            }
          },
          yaxis: {
            lines: {
              show: true
            }
          },
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 10
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: isDark ? 'dark' : 'light',
            type: 'vertical',
            shadeIntensity: 0.5,
            gradientToColors: ['#3B82F6'],
            inverseColors: false,
            opacityFrom: 0.8,
            opacityTo: 0.2,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          type: 'category',
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              colors: textColor
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              colors: textColor
            }
          }
        }
      },
      ticketsAndTimes: {
        qtd_total_atendimentos: null,
        qtd_demanda_ativa: null,
        qtd_demanda_receptiva: null,
        tma: null,
        tme: null
      },
      ticketsPerUsersDetail: [],
      TicketsPerUsersDetailColumn: [
        {
          name: 'name',
          label: 'Usuário',
          field: 'name',
          align: 'left',
          style: 'width: 300px;',
          format: (v, r) => {
            return v ? `${r.name} | ${r.email}` : 'Não informado'
          }
        },
        {
          name: 'qtd_pendentes',
          label: 'Pendentes',
          field: 'qtd_pendentes'
        },
        {
          name: 'qtd_em_atendimento',
          label: 'Atendendo',
          field: 'qtd_em_atendimento'
        },
        {
          name: 'qtd_resolvidos',
          label: 'Finalizados',
          field: 'qtd_resolvidos'
        },
        {
          name: 'qtd_por_usuario',
          label: 'Total',
          field: 'qtd_por_usuario'
        },
        {
          name: 'tme',
          label: 'T.M.E',
          field: 'tme',
          align: 'center',
          headerStyle: 'text-align: center !important',
          format: v => {
            return formatDuration(v) || ''
          }
        },
        {
          name: 'tma',
          label: 'T.M.A',
          field: 'tma',
          align: 'center',
          headerStyle: 'text-align: center !important',
          format: v => {
            return formatDuration(v) || ''
          }
        }
      ],
      lightenColor
    }
  },
  watch: {
    '$q.dark.isActive' () {
      // Atualiza as opções dos gráficos para o modo escuro
      const isDark = this.$q.dark.isActive
      const textColor = isDark ? '#fff' : '#373d3f'
      const gridColor = isDark ? '#404040' : '#e7e7e7'

      // Atualiza opções do gráfico de canais
      this.ticketsChannelsOptions = {
        ...this.ticketsChannelsOptions,
        chart: {
          ...this.ticketsChannelsOptions.chart,
          foreColor: textColor,
          background: 'transparent'
        },
        theme: {
          mode: isDark ? 'dark' : 'light'
        },
        plotOptions: {
          ...this.ticketsChannelsOptions.plotOptions,
          pie: {
            ...this.ticketsChannelsOptions.plotOptions.pie,
            donut: {
              ...this.ticketsChannelsOptions.plotOptions.pie.donut,
              labels: {
                ...this.ticketsChannelsOptions.plotOptions.pie.donut.labels,
                name: {
                  ...this.ticketsChannelsOptions.plotOptions.pie.donut.labels.name,
                  color: textColor
                },
                value: {
                  ...this.ticketsChannelsOptions.plotOptions.pie.donut.labels.value,
                  color: textColor
                }
              }
            }
          }
        },
        dataLabels: {
          ...this.ticketsChannelsOptions.dataLabels,
          style: {
            ...this.ticketsChannelsOptions.dataLabels.style,
            colors: [textColor]
          }
        },
        legend: {
          ...this.ticketsChannelsOptions.legend,
          labels: {
            ...this.ticketsChannelsOptions.legend.labels,
            colors: textColor
          }
        }
      }

      // Atualiza opções do gráfico de filas
      this.ticketsQueueOptions = {
        ...this.ticketsQueueOptions,
        chart: {
          ...this.ticketsQueueOptions.chart,
          foreColor: textColor,
          background: 'transparent'
        },
        theme: {
          mode: isDark ? 'dark' : 'light'
        },
        plotOptions: {
          ...this.ticketsQueueOptions.plotOptions,
          pie: {
            ...this.ticketsQueueOptions.plotOptions.pie,
            donut: {
              ...this.ticketsQueueOptions.plotOptions.pie.donut,
              labels: {
                ...this.ticketsQueueOptions.plotOptions.pie.donut.labels,
                name: {
                  ...this.ticketsQueueOptions.plotOptions.pie.donut.labels.name,
                  color: textColor
                },
                value: {
                  ...this.ticketsQueueOptions.plotOptions.pie.donut.labels.value,
                  color: textColor
                }
              }
            }
          }
        },
        dataLabels: {
          ...this.ticketsQueueOptions.dataLabels,
          style: {
            ...this.ticketsQueueOptions.dataLabels.style,
            colors: [textColor]
          }
        },
        legend: {
          ...this.ticketsQueueOptions.legend,
          labels: {
            ...this.ticketsQueueOptions.legend.labels,
            colors: textColor
          }
        }
      }

      // Atualiza opções do gráfico de evolução por canais
      this.ticketsEvolutionChannelsOptions = {
        ...this.ticketsEvolutionChannelsOptions,
        chart: {
          ...this.ticketsEvolutionChannelsOptions.chart,
          foreColor: textColor,
          background: 'transparent'
        },
        theme: {
          mode: isDark ? 'dark' : 'light'
        },
        grid: {
          ...this.ticketsEvolutionChannelsOptions.grid,
          borderColor: gridColor,
          xaxis: {
            ...this.ticketsEvolutionChannelsOptions.grid.xaxis,
            lines: {
              show: true
            }
          },
          yaxis: {
            ...this.ticketsEvolutionChannelsOptions.grid.yaxis,
            lines: {
              show: true
            }
          }
        },
        xaxis: {
          ...this.ticketsEvolutionChannelsOptions.xaxis,
          labels: {
            ...this.ticketsEvolutionChannelsOptions.xaxis.labels,
            style: {
              ...this.ticketsEvolutionChannelsOptions.xaxis.labels.style,
              colors: textColor
            }
          }
        },
        yaxis: {
          ...this.ticketsEvolutionChannelsOptions.yaxis,
          labels: {
            ...this.ticketsEvolutionChannelsOptions.yaxis.labels,
            style: {
              ...this.ticketsEvolutionChannelsOptions.yaxis.labels.style,
              colors: textColor
            }
          }
        },
        dataLabels: {
          ...this.ticketsEvolutionChannelsOptions.dataLabels,
          style: {
            ...this.ticketsEvolutionChannelsOptions.dataLabels.style,
            colors: [textColor]
          }
        },
        fill: {
          ...this.ticketsEvolutionChannelsOptions.fill,
          gradient: {
            ...this.ticketsEvolutionChannelsOptions.fill.gradient,
            shade: isDark ? 'dark' : 'light'
          }
        },
        tooltip: {
          ...this.ticketsEvolutionChannelsOptions.tooltip,
          theme: isDark ? 'dark' : 'light'
        }
      }

      // Atualiza opções do gráfico de evolução por período
      this.ticketsEvolutionByPeriodOptions = {
        ...this.ticketsEvolutionByPeriodOptions,
        chart: {
          ...this.ticketsEvolutionByPeriodOptions.chart,
          foreColor: textColor,
          background: 'transparent'
        },
        theme: {
          mode: isDark ? 'dark' : 'light'
        },
        grid: {
          ...this.ticketsEvolutionByPeriodOptions.grid,
          borderColor: gridColor,
          row: {
            ...this.ticketsEvolutionByPeriodOptions.grid.row,
            colors: isDark ? ['#404040', 'transparent'] : ['#f3f3f3', 'transparent']
          }
        },
        xaxis: {
          ...this.ticketsEvolutionByPeriodOptions.xaxis,
          labels: {
            ...this.ticketsEvolutionByPeriodOptions.xaxis.labels,
            style: {
              ...this.ticketsEvolutionByPeriodOptions.xaxis.labels.style,
              colors: textColor
            }
          }
        },
        yaxis: {
          ...this.ticketsEvolutionByPeriodOptions.yaxis,
          labels: {
            ...this.ticketsEvolutionByPeriodOptions.yaxis.labels,
            style: {
              ...this.ticketsEvolutionByPeriodOptions.yaxis.labels.style,
              colors: textColor
            }
          }
        },
        tooltip: {
          ...this.ticketsEvolutionByPeriodOptions.tooltip,
          theme: isDark ? 'dark' : 'light'
        }
      }

      // Atualiza os gráficos
      if (this.$refs.ChartTicketsChannels) {
        this.$refs.ChartTicketsChannels.updateOptions(this.ticketsChannelsOptions)
      }
      if (this.$refs.ChartTicketsQueue) {
        this.$refs.ChartTicketsQueue.updateOptions(this.ticketsQueueOptions)
      }
      if (this.$refs.ChartTicketsEvolutionChannels) {
        this.$refs.ChartTicketsEvolutionChannels.updateOptions(this.ticketsEvolutionChannelsOptions)
      }
      if (this.$refs.ChartTicketsEvolutionByPeriod) {
        this.$refs.ChartTicketsEvolutionByPeriod.updateOptions(this.ticketsEvolutionByPeriodOptions)
      }
    },
    '$q.screen.width' () {
      this.setConfigWidth()
    }
  },
  computed: {
    cTmaFormat () {
      const tma = this.ticketsAndTimes.tma || {}
      return formatDuration(tma) || ''
    },
    cTmeFormat () {
      const tme = this.ticketsAndTimes.tme || {}
      return formatDuration(tme) || ''
    }
  },
  methods: {
    async listarFilas () {
      const { data } = await ListarFilas()
      this.filas = data
    },
    setConfigWidth () {
      const diffDays = differenceInDays(new Date(this.params.endDate), new Date(this.params.startDate))
      if (diffDays > 30) {
        this.configWidth = { horizontal: true, width: 2200 }
      } else {
        const actualWidth = this.$q.screen.width
        this.configWidth = { horizontal: true, width: actualWidth - (actualWidth < 768 ? 40 : 100) }
      }
    },
    getDashTicketsAndTimes () {
      GetDashTicketsAndTimes(this.params).then(res => {
        this.ticketsAndTimes = res.data[0]
      })
        .catch(err => {
          console.error(err)
        })
    },
    getDashTicketsQueue () {
      GetDashTicketsQueue(this.params).then(res => {
        this.ticketsQueue = res.data
        const series = []
        const labels = []
        this.ticketsQueue.forEach(e => {
          series.push(+e.qtd)
          labels.push(e.label)
        })
        this.ticketsQueueOptions.series = series
        this.ticketsQueueOptions.labels = labels
        this.$refs.ChartTicketsQueue.updateOptions(this.ticketsQueueOptions)
        this.$refs.ChartTicketsQueue.updateSeries(series, true)
      })
        .catch(err => {
          console.error(err)
        })
    },
    getDashTicketsChannels () {
      GetDashTicketsChannels(this.params).then(res => {
        this.ticketsChannels = res.data
        const series = []
        const labels = []
        this.ticketsChannels.forEach(e => {
          series.push(+e.qtd)
          labels.push(e.label)
        })
        this.ticketsChannelsOptions.series = series
        this.ticketsChannelsOptions.labels = labels
        this.$refs.ChartTicketsChannels.updateOptions(this.ticketsChannelsOptions)
        this.$refs.ChartTicketsChannels.updateSeries(series, true)
      })
        .catch(err => {
          console.error(err)
        })
    },
    getDashTicketsEvolutionChannels () {
      GetDashTicketsEvolutionChannels(this.params)
        .then(res => {
          this.ticketsEvolutionChannels = res.data
          const dataLabel = groupBy({ ...this.ticketsEvolutionChannels }, 'dt_referencia')
          const labels = Object.keys(dataLabel)
          this.ticketsEvolutionChannelsOptions.labels = labels
          this.ticketsEvolutionChannelsOptions.xaxis.categories = labels
          const series = []
          const dados = groupBy({ ...this.ticketsEvolutionChannels }, 'label')
          for (const item in dados) {
            series.push({
              name: item,
              data: dados[item].map(d => {
                return d.qtd
              })
            })
          }
          this.ticketsEvolutionChannelsOptions.series = series
          this.$refs.ChartTicketsEvolutionChannels.updateOptions(this.ticketsEvolutionChannelsOptions)
          this.$refs.ChartTicketsEvolutionChannels.updateSeries(series, true)
        })
        .catch(error => {
          console.error(error)
        })
    },
    getDashTicketsEvolutionByPeriod () {
      GetDashTicketsEvolutionByPeriod(this.params)
        .then(res => {
          this.ticketsEvolutionByPeriod = res.data
          const series = [{
            name: 'Atendimentos',
            type: 'column',
            data: []
          }, {
            type: 'line',
            data: []
          }]
          const labels = []
          this.ticketsEvolutionByPeriod.forEach(e => {
            series[0].data.push(+e.qtd)
            labels.push(e.label)
          })
          series[1].data = series[0].data
          this.ticketsEvolutionByPeriodOptions.labels = labels
          this.ticketsEvolutionByPeriodOptions.series = series
          this.$refs.ChartTicketsEvolutionByPeriod.updateOptions(this.ticketsEvolutionByPeriodOptions)
          this.$refs.ChartTicketsEvolutionByPeriod.updateSeries(series, true)
        })
        .catch(error => {
          console.error(error)
        })
    },
    getDashTicketsPerUsersDetail () {
      GetDashTicketsPerUsersDetail(this.params)
        .then(res => {
          this.ticketsPerUsersDetail = res.data
        })
        .catch(error => {
          console.error(error)
        })
    },
    getDashData () {
      this.setConfigWidth()
      this.getDashTicketsAndTimes()
      this.getDashTicketsChannels()
      this.getDashTicketsEvolutionChannels()
      this.getDashTicketsQueue()
      this.getDashTicketsEvolutionByPeriod()
      this.getDashTicketsPerUsersDetail()
    },
    setToday () {
      this.params.startDate = format(new Date(), 'yyyy-MM-dd')
      this.params.endDate = format(new Date(), 'yyyy-MM-dd')
      this.getDashData()
    }
  },
  beforeMount () {
    // Inicializa as opções dos gráficos com o tema atual
    this.$watch('$q.dark.isActive')()
  },
  mounted () {
    this.listarFilas()
    this.getDashData()
  }
}
</script>

<style lang="sass">
.filter-card
  background: linear-gradient(to right, var(--q-primary-lighten-4), var(--q-primary-lighten-5))
  border-radius: 12px
  box-shadow: 0 2px 4px rgba(0,0,0,0.05)
  .q-dark &
    background: linear-gradient(to right, #1d1d1d, #2d2d2d)
    box-shadow: 0 2px 4px rgba(0,0,0,0.2)

.metrics-card
  background: linear-gradient(to right, var(--q-primary-lighten-4), var(--q-primary-lighten-5))
  border-radius: 12px
  box-shadow: 0 2px 4px rgba(0,0,0,0.05)
  .q-dark &
    background: linear-gradient(to right, #1d1d1d, #2d2d2d)
    box-shadow: 0 2px 4px rgba(0,0,0,0.2)

.metric-card-item
  transition: all 0.3s ease
  border-radius: 12px
  background: var(--q-primary-lighten-5)
  .q-dark &
    background: #2d2d2d
  &:hover
    transform: translateY(-2px)
    box-shadow: 0 4px 8px rgba(0,0,0,0.1)
    .q-dark &
      box-shadow: 0 4px 8px rgba(0,0,0,0.3)

.chart-card
  transition: all 0.3s ease
  border-radius: 12px
  background: linear-gradient(to right, var(--q-primary-lighten-4), var(--q-primary-lighten-5))
  .q-dark &
    background: linear-gradient(to right, #1d1d1d, #2d2d2d)
  &:hover
    box-shadow: 0 4px 8px rgba(0,0,0,0.1)
    .q-dark &
      box-shadow: 0 4px 8px rgba(0,0,0,0.3)

.performance-card
  background: linear-gradient(to right, var(--q-primary-lighten-4), var(--q-primary-lighten-5))
  border-radius: 12px
  box-shadow: 0 2px 4px rgba(0,0,0,0.05)
  .q-dark &
    background: linear-gradient(to right, #1d1d1d, #2d2d2d)
    box-shadow: 0 2px 4px rgba(0,0,0,0.2)

.performance-table
  .q-table__middle
    max-height: 400px
  .q-table__grid-content
    padding: 8px
  .q-table__grid-item
    padding: 8px
  .q-dark &
    background: #2d2d2d
</style>

<style lang="scss">
.apexcharts-theme-dark {
  .apexcharts-canvas {
    background: transparent !important;
  }
  .apexcharts-text {
    fill: #fff !important;
  }
  .apexcharts-title-text {
    fill: #fff !important;
  }
  .apexcharts-subtitle-text {
    fill: #fff !important;
  }
  .apexcharts-xaxis-label {
    fill: #fff !important;
  }
  .apexcharts-yaxis-label {
    fill: #fff !important;
  }
  .apexcharts-legend-text {
    fill: #fff !important;
    color: #fff !important;
  }
  .apexcharts-gridline {
    stroke: #404040 !important;
  }
  .apexcharts-tooltip {
    background: #1d1d1d !important;
    color: #fff !important;
  }
  .apexcharts-legend-series {
    color: #fff !important;
  }
  .apexcharts-pie-label {
    fill: #fff !important;
  }
  .apexcharts-datalabel {
    fill: #fff !important;
  }
  .apexcharts-marker {
    stroke: #404040 !important;
  }
  .apexcharts-plot-series {
    .apexcharts-area {
      fill-opacity: 0.2;
    }
  }
}

body.body--dark {
  .chart-card, .metrics-card, .filter-card, .performance-card {
    background: linear-gradient(to right, #1d1d1d, #2d2d2d);
  }
  .metric-card-item {
    background: #2d2d2d;
  }
  .q-table {
    background: #2d2d2d;
    color: #fff;
  }
}
</style>
