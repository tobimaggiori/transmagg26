VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{F9043C88-F6F2-101A-A3C9-08002B2F49FB}#1.2#0"; "comdlg32.ocx"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form NuevaOrdenPago 
   BackColor       =   &H80000007&
   Caption         =   "Nueva Orden de Pago"
   ClientHeight    =   9555
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   15780
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   9555
   ScaleWidth      =   15780
   Begin MSComDlg.CommonDialog CommonDialog1 
      Left            =   360
      Top             =   8040
      _ExtentX        =   847
      _ExtentY        =   847
      _Version        =   393216
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   8880
      TabIndex        =   75
      Top             =   240
      Width           =   1695
      _ExtentX        =   2990
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1080
      TabIndex        =   12
      Text            =   "Text1"
      Top             =   240
      Width           =   975
   End
   Begin VB.Frame Frame3 
      BackColor       =   &H80000007&
      Caption         =   "Detalle Orden de PAgo"
      ForeColor       =   &H000040C0&
      Height          =   8655
      Left            =   9840
      TabIndex        =   10
      Top             =   720
      Width           =   5775
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H000000FF&
         Height          =   285
         Index           =   14
         Left            =   4200
         TabIndex        =   39
         Text            =   "Text1"
         Top             =   7680
         Width           =   1050
      End
      Begin VB.Frame Frame6 
         BackColor       =   &H80000007&
         Caption         =   "Detalle Pago"
         ForeColor       =   &H000040C0&
         Height          =   5175
         Left            =   240
         TabIndex        =   23
         Top             =   2280
         Width           =   5415
         Begin VB.Frame Frame5 
            BackColor       =   &H80000008&
            Caption         =   "Totales Factura Comisión"
            ForeColor       =   &H000040C0&
            Height          =   255
            Left            =   120
            TabIndex        =   40
            Top             =   360
            Visible         =   0   'False
            Width           =   5175
            Begin VB.TextBox Text1 
               Alignment       =   1  'Right Justify
               BeginProperty Font 
                  Name            =   "MS Sans Serif"
                  Size            =   8.25
                  Charset         =   0
                  Weight          =   700
                  Underline       =   0   'False
                  Italic          =   0   'False
                  Strikethrough   =   0   'False
               EndProperty
               Height          =   285
               Index           =   4
               Left            =   3840
               TabIndex        =   43
               Text            =   "Text1"
               Top             =   1200
               Width           =   1050
            End
            Begin VB.TextBox Text1 
               Alignment       =   1  'Right Justify
               Height          =   285
               Index           =   5
               Left            =   3840
               TabIndex        =   42
               Text            =   "Text1"
               Top             =   720
               Width           =   1050
            End
            Begin VB.TextBox Text1 
               Alignment       =   1  'Right Justify
               Height          =   285
               Index           =   6
               Left            =   3840
               TabIndex        =   41
               Text            =   "Text1"
               Top             =   360
               Width           =   1050
            End
            Begin VB.Line Line2 
               BorderColor     =   &H000040C0&
               X1              =   3720
               X2              =   5040
               Y1              =   1080
               Y2              =   1080
            End
            Begin VB.Label Etiqueta 
               BackColor       =   &H00000000&
               Caption         =   "Total General Factura Comisión"
               BeginProperty Font 
                  Name            =   "MS Sans Serif"
                  Size            =   8.25
                  Charset         =   0
                  Weight          =   700
                  Underline       =   0   'False
                  Italic          =   0   'False
                  Strikethrough   =   0   'False
               EndProperty
               ForeColor       =   &H0080C0FF&
               Height          =   255
               Index           =   8
               Left            =   360
               TabIndex        =   46
               Top             =   1200
               Width           =   3135
            End
            Begin VB.Label Etiqueta 
               BackColor       =   &H00000000&
               Caption         =   "Total IVA Factura Comisión"
               BeginProperty Font 
                  Name            =   "MS Sans Serif"
                  Size            =   8.25
                  Charset         =   0
                  Weight          =   700
                  Underline       =   0   'False
                  Italic          =   0   'False
                  Strikethrough   =   0   'False
               EndProperty
               ForeColor       =   &H0080C0FF&
               Height          =   255
               Index           =   7
               Left            =   360
               TabIndex        =   45
               Top             =   720
               Width           =   3135
            End
            Begin VB.Label Etiqueta 
               BackColor       =   &H00000000&
               Caption         =   "Total Neto Factura Comisión"
               BeginProperty Font 
                  Name            =   "MS Sans Serif"
                  Size            =   8.25
                  Charset         =   0
                  Weight          =   700
                  Underline       =   0   'False
                  Italic          =   0   'False
                  Strikethrough   =   0   'False
               EndProperty
               ForeColor       =   &H0080C0FF&
               Height          =   255
               Index           =   6
               Left            =   360
               TabIndex        =   44
               Top             =   360
               Width           =   3135
            End
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            Height          =   285
            Index           =   13
            Left            =   3960
            TabIndex        =   37
            Text            =   "Text1"
            Top             =   3120
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   12
            Left            =   3960
            TabIndex        =   36
            Text            =   "Text1"
            Top             =   2640
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   11
            Left            =   3960
            TabIndex        =   35
            Text            =   "Text1"
            Top             =   2280
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   10
            Left            =   3960
            TabIndex        =   34
            Text            =   "Text1"
            Top             =   1920
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   9
            Left            =   3960
            TabIndex        =   33
            Text            =   "Text1"
            Top             =   1560
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   8
            Left            =   3960
            TabIndex        =   32
            Text            =   "Text1"
            Top             =   1200
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   7
            Left            =   3960
            TabIndex        =   31
            Text            =   "Text1"
            Top             =   840
            Width           =   1050
         End
         Begin VB.Line Line3 
            BorderColor     =   &H000040C0&
            X1              =   3840
            X2              =   5160
            Y1              =   3000
            Y2              =   3000
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Pago"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   15
            Left            =   240
            TabIndex        =   30
            Top             =   3120
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Faltantes de Carga"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   14
            Left            =   240
            TabIndex        =   29
            Top             =   2640
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Adelantos en Gas-Oil"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   13
            Left            =   240
            TabIndex        =   28
            Top             =   2280
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Adelantos en Efvo"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   12
            Left            =   240
            TabIndex        =   27
            Top             =   1920
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Pago Cheque Terceros"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   11
            Left            =   240
            TabIndex        =   26
            Top             =   1560
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Pago Cheques Propios"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   10
            Left            =   240
            TabIndex        =   25
            Top             =   1200
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Pago en Efectivo"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   9
            Left            =   240
            TabIndex        =   24
            Top             =   840
            Width           =   3135
         End
      End
      Begin VB.Frame Frame4 
         BackColor       =   &H80000008&
         Caption         =   "Totales Facturas Aplicadas"
         ForeColor       =   &H000040C0&
         Height          =   1815
         Left            =   240
         TabIndex        =   16
         Top             =   360
         Width           =   5415
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   3
            Left            =   3960
            TabIndex        =   22
            Text            =   "Text1"
            Top             =   1200
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   2
            Left            =   3960
            TabIndex        =   21
            Text            =   "Text1"
            Top             =   720
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   1
            Left            =   3960
            TabIndex        =   20
            Text            =   "Text1"
            Top             =   360
            Width           =   1050
         End
         Begin VB.Line Line1 
            BorderColor     =   &H000040C0&
            X1              =   3840
            X2              =   5160
            Y1              =   1080
            Y2              =   1080
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total General Facturas Aplicadas"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   5
            Left            =   360
            TabIndex        =   19
            Top             =   1200
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total IVA Facturas Aplicadas"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   4
            Left            =   360
            TabIndex        =   18
            Top             =   720
            Width           =   3135
         End
         Begin VB.Label Etiqueta 
            BackColor       =   &H00000000&
            Caption         =   "Total Neto Facturas Aplicadas"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Index           =   3
            Left            =   360
            TabIndex        =   17
            Top             =   360
            Width           =   3135
         End
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "DIFERENCIA "
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   16
         Left            =   480
         TabIndex        =   38
         Top             =   7680
         Width           =   3135
      End
   End
   Begin KewlButtonz.KewlButtons CargarDesc 
      Height          =   615
      Left            =   240
      TabIndex        =   47
      Top             =   6960
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Efectivo"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NuevaOrdenPAgo.frx":0000
      PICN            =   "NuevaOrdenPAgo.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons KewlButtons1 
      Height          =   615
      Left            =   2640
      TabIndex        =   48
      Top             =   6960
      Width           =   2175
      _ExtentX        =   3836
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Cheques Propios"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NuevaOrdenPAgo.frx":0336
      PICN            =   "NuevaOrdenPAgo.frx":0352
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons KewlButtons2 
      Height          =   615
      Index           =   0
      Left            =   5160
      TabIndex        =   49
      Top             =   6960
      Width           =   2175
      _ExtentX        =   3836
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Cheques Terceros"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NuevaOrdenPAgo.frx":066C
      PICN            =   "NuevaOrdenPAgo.frx":0688
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   735
      Left            =   1440
      TabIndex        =   72
      Top             =   8040
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Grabar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NuevaOrdenPAgo.frx":09A2
      PICN            =   "NuevaOrdenPAgo.frx":09BE
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Cancelar 
      Height          =   735
      Left            =   4320
      TabIndex        =   73
      Top             =   8040
      Width           =   2055
      _ExtentX        =   3625
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Cancelar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NuevaOrdenPAgo.frx":2A40
      PICN            =   "NuevaOrdenPAgo.frx":2A5C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Frame CHTerceros 
      BackColor       =   &H00000000&
      Caption         =   "Cheques de Terceros"
      ForeColor       =   &H000040C0&
      Height          =   5895
      Left            =   240
      TabIndex        =   66
      Top             =   720
      Visible         =   0   'False
      Width           =   7095
      Begin VB.Frame CHTAdel 
         BackColor       =   &H80000012&
         Caption         =   "Cheques Adelantados"
         ForeColor       =   &H0080C0FF&
         Height          =   1695
         Left            =   120
         TabIndex        =   78
         Top             =   1680
         Width           =   6855
         Begin MSComctlLib.ListView LCHTAdel 
            Height          =   1215
            Left            =   240
            TabIndex        =   79
            Top             =   360
            Width           =   6375
            _ExtentX        =   11245
            _ExtentY        =   2143
            View            =   3
            LabelWrap       =   0   'False
            HideSelection   =   0   'False
            FullRowSelect   =   -1  'True
            _Version        =   393217
            ForeColor       =   -2147483640
            BackColor       =   -2147483643
            BorderStyle     =   1
            Appearance      =   1
            NumItems        =   4
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "Nro Ch"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   3528
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Vencimiento"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
      End
      Begin MSComctlLib.ListView ChCartera 
         Height          =   1215
         Left            =   360
         TabIndex        =   67
         Top             =   360
         Width           =   6375
         _ExtentX        =   11245
         _ExtentY        =   2143
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Nro Ch"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Banco"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Vencimiento"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
      End
      Begin MSComctlLib.ListView CHTerAplic 
         Height          =   1215
         Left            =   360
         TabIndex        =   68
         Top             =   3480
         Width           =   6375
         _ExtentX        =   11245
         _ExtentY        =   2143
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Nro Ch"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Banco"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Vencimiento"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Adel"
            Object.Width           =   2540
         EndProperty
      End
      Begin KewlButtonz.KewlButtons KewlButtons3 
         Height          =   375
         Left            =   2040
         TabIndex        =   71
         Top             =   5280
         Width           =   3015
         _ExtentX        =   5318
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Volver al Resumen"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "NuevaOrdenPAgo.frx":2FF6
         PICN            =   "NuevaOrdenPAgo.frx":3012
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques de Terceros"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   23
         Left            =   600
         TabIndex        =   70
         Top             =   4800
         Width           =   3135
      End
      Begin VB.Label Label3 
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label3"
         Height          =   255
         Left            =   4920
         TabIndex        =   69
         Top             =   4800
         Width           =   1455
      End
   End
   Begin VB.Frame Descuentos 
      BackColor       =   &H00000000&
      Caption         =   "Descuentos y Efectivo"
      ForeColor       =   &H000040C0&
      Height          =   5175
      Left            =   240
      TabIndex        =   80
      Top             =   720
      Visible         =   0   'False
      Width           =   9495
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   21
         Left            =   1200
         TabIndex        =   100
         Text            =   "Text1"
         Top             =   840
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   15
         Left            =   1200
         TabIndex        =   98
         Text            =   "Text1"
         Top             =   480
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   19
         Left            =   1800
         TabIndex        =   85
         Text            =   "Text1"
         Top             =   2400
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   18
         Left            =   1800
         TabIndex        =   84
         Text            =   "Text1"
         Top             =   2040
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   17
         Left            =   1800
         TabIndex        =   83
         Text            =   "Text1"
         Top             =   1680
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   16
         Left            =   1200
         TabIndex        =   82
         Text            =   "Text1"
         Top             =   1200
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   20
         Left            =   3600
         TabIndex        =   81
         Text            =   "Text1"
         Top             =   4560
         Width           =   1455
      End
      Begin MSComctlLib.ListView DescPendientes 
         Height          =   1335
         Left            =   3600
         TabIndex        =   86
         Top             =   1320
         Width           =   4275
         _ExtentX        =   7541
         _ExtentY        =   2355
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "PtoVta"
            Object.Width           =   529
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Numero"
            Object.Width           =   1411
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
      End
      Begin MSComctlLib.ListView ListDescuentos 
         Height          =   1575
         Left            =   120
         TabIndex        =   87
         Top             =   2880
         Width           =   8775
         _ExtentX        =   15478
         _ExtentY        =   2778
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Nro Remito"
            Object.Width           =   3792
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Adelanto Efvo"
            Object.Width           =   3792
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Adelantos de Gas-Oil"
            Object.Width           =   3792
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Faltantes"
            Object.Width           =   3792
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "PtoVta"
            Object.Width           =   2540
         EndProperty
      End
      Begin KewlButtonz.KewlButtons AgregarDesc 
         Height          =   375
         Left            =   7920
         TabIndex        =   88
         Top             =   1320
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Agregar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "NuevaOrdenPAgo.frx":332C
         PICN            =   "NuevaOrdenPAgo.frx":3348
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons KewlButtons2 
         Height          =   375
         Index           =   1
         Left            =   7920
         TabIndex        =   89
         Top             =   1680
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Eliminar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "NuevaOrdenPAgo.frx":53CA
         PICN            =   "NuevaOrdenPAgo.frx":53E6
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons VolverDesc 
         Height          =   375
         Left            =   9480
         TabIndex        =   90
         Top             =   2760
         Width           =   2295
         _ExtentX        =   4048
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Volver a Resumen"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "NuevaOrdenPAgo.frx":5980
         PICN            =   "NuevaOrdenPAgo.frx":599C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label24 
         BackColor       =   &H00000000&
         Caption         =   "Pto Venta"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   3
         Left            =   120
         TabIndex        =   99
         Top             =   840
         Width           =   1215
      End
      Begin VB.Label Label24 
         BackColor       =   &H00000000&
         Caption         =   "Efectivo"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   2
         Left            =   120
         TabIndex        =   97
         Top             =   480
         Width           =   1215
      End
      Begin VB.Label Label24 
         Alignment       =   2  'Center
         BackColor       =   &H00000000&
         Caption         =   "Adelantos Pendientes"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   1
         Left            =   3600
         TabIndex        =   96
         Top             =   1080
         Width           =   4215
      End
      Begin VB.Label Label27 
         BackColor       =   &H00000000&
         Caption         =   "Faltantes"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   0
         Left            =   120
         TabIndex        =   95
         Top             =   2400
         Width           =   1215
      End
      Begin VB.Label Label26 
         BackColor       =   &H00000000&
         Caption         =   "Adelantos Gas-Oil"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Left            =   120
         TabIndex        =   94
         Top             =   2040
         Width           =   1575
      End
      Begin VB.Label Label25 
         BackColor       =   &H00000000&
         Caption         =   "Adelanto Efvo"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Left            =   120
         TabIndex        =   93
         Top             =   1680
         Width           =   1455
      End
      Begin VB.Label Label24 
         BackColor       =   &H00000000&
         Caption         =   "Remito Nro"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   0
         Left            =   120
         TabIndex        =   92
         Top             =   1200
         Width           =   1215
      End
      Begin VB.Label Label27 
         BackColor       =   &H00000000&
         Caption         =   "Total Descuentos"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   1
         Left            =   1320
         TabIndex        =   91
         Top             =   4560
         Width           =   1815
      End
   End
   Begin VB.Frame Frame2 
      BackColor       =   &H80000007&
      Caption         =   "Facturas Aplicadas"
      ForeColor       =   &H000040C0&
      Height          =   3255
      Left            =   240
      TabIndex        =   2
      Top             =   3600
      Width           =   7095
      Begin MSComctlLib.ListView FactAplicadas 
         Height          =   1695
         Left            =   240
         TabIndex        =   3
         Top             =   600
         Width           =   6645
         _ExtentX        =   11721
         _ExtentY        =   2990
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   7
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "NroFact"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Fecha"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Alignment       =   1
            SubItemIndex    =   2
            Text            =   "Neto"
            Object.Width           =   2364
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Alignment       =   1
            SubItemIndex    =   3
            Text            =   "IVA"
            Object.Width           =   2364
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Alignment       =   1
            SubItemIndex    =   4
            Text            =   "Total"
            Object.Width           =   2364
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "PtoVta"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "CodComp"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Totales"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   2
         Left            =   360
         TabIndex        =   15
         Top             =   2400
         Width           =   1695
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackColor       =   &H00FFFFFF&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label1"
         Height          =   255
         Index           =   5
         Left            =   2520
         TabIndex        =   9
         Top             =   2400
         Width           =   1275
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackColor       =   &H00FFFFFF&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label1"
         Height          =   255
         Index           =   4
         Left            =   3840
         TabIndex        =   8
         Top             =   2400
         Width           =   1275
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackColor       =   &H00FFFFFF&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label1"
         Height          =   255
         Index           =   3
         Left            =   5160
         TabIndex        =   7
         Top             =   2400
         Width           =   1275
      End
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Facturas Pendientes"
      ForeColor       =   &H000040C0&
      Height          =   2775
      Left            =   240
      TabIndex        =   0
      Top             =   720
      Width           =   7095
      Begin MSComctlLib.ListView FacturasPend 
         Height          =   1695
         Left            =   240
         TabIndex        =   1
         Top             =   360
         Width           =   6645
         _ExtentX        =   11721
         _ExtentY        =   2990
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   7
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "NroFact"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Fecha"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Alignment       =   1
            SubItemIndex    =   2
            Text            =   "Neto"
            Object.Width           =   2364
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Alignment       =   1
            SubItemIndex    =   3
            Text            =   "IVA"
            Object.Width           =   2364
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Alignment       =   1
            SubItemIndex    =   4
            Text            =   "Total"
            Object.Width           =   2364
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "PtoVta"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "CodComp"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Totales"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   1
         Left            =   360
         TabIndex        =   14
         Top             =   2160
         Width           =   1575
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackColor       =   &H00FFFFFF&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label1"
         Height          =   255
         Index           =   2
         Left            =   2520
         TabIndex        =   6
         Top             =   2160
         Width           =   1275
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackColor       =   &H00FFFFFF&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label1"
         Height          =   255
         Index           =   1
         Left            =   3840
         TabIndex        =   5
         Top             =   2160
         Width           =   1275
      End
      Begin VB.Label Label1 
         Alignment       =   1  'Right Justify
         BackColor       =   &H00FFFFFF&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label1"
         Height          =   255
         Index           =   0
         Left            =   5160
         TabIndex        =   4
         Top             =   2160
         Width           =   1275
      End
   End
   Begin VB.Frame CHPropios 
      BackColor       =   &H80000007&
      Caption         =   "Cheques Propios"
      ForeColor       =   &H000040C0&
      Height          =   5895
      Left            =   240
      TabIndex        =   50
      Top             =   720
      Visible         =   0   'False
      Width           =   7095
      Begin VB.Frame Adelantados 
         BackColor       =   &H80000007&
         Caption         =   "CH Adelantados"
         ForeColor       =   &H0080C0FF&
         Height          =   1815
         Left            =   240
         TabIndex        =   76
         Top             =   1440
         Width           =   6735
         Begin MSComctlLib.ListView CHPAdel 
            Height          =   1455
            Left            =   120
            TabIndex        =   77
            Top             =   240
            Width           =   6495
            _ExtentX        =   11456
            _ExtentY        =   2566
            View            =   3
            LabelWrap       =   0   'False
            HideSelection   =   0   'False
            FullRowSelect   =   -1  'True
            _Version        =   393217
            ForeColor       =   -2147483640
            BackColor       =   -2147483643
            BorderStyle     =   1
            Appearance      =   1
            NumItems        =   5
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "CtaCte"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   2822
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Nro"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Vto"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
      End
      Begin MSComctlLib.ListView ListCHP 
         Height          =   1455
         Left            =   360
         TabIndex        =   62
         Top             =   3360
         Width           =   6495
         _ExtentX        =   11456
         _ExtentY        =   2566
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "CtaCte"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Banco"
            Object.Width           =   2822
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Nro"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Vto"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Adel"
            Object.Width           =   353
         EndProperty
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   2
         Left            =   1680
         TabIndex        =   60
         Text            =   "Text2"
         Top             =   1080
         Width           =   1455
      End
      Begin MSMask.MaskEdBox VtoCHPropio 
         Height          =   285
         Left            =   5400
         TabIndex        =   57
         Top             =   720
         Width           =   1455
         _ExtentX        =   2566
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   1
         Left            =   1680
         TabIndex        =   55
         Text            =   "Text2"
         Top             =   720
         Width           =   1815
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   0
         Left            =   1680
         TabIndex        =   52
         Text            =   "Text2"
         Top             =   360
         Width           =   1335
      End
      Begin KewlButtonz.KewlButtons AgregarCHP 
         Height          =   375
         Left            =   3480
         TabIndex        =   61
         Top             =   1080
         Width           =   2415
         _ExtentX        =   4260
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Agregar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "NuevaOrdenPAgo.frx":5CB6
         PICN            =   "NuevaOrdenPAgo.frx":5CD2
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Volver 
         Height          =   375
         Left            =   1800
         TabIndex        =   65
         Top             =   5400
         Width           =   3015
         _ExtentX        =   5318
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Volver al Resumen"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "NuevaOrdenPAgo.frx":7D54
         PICN            =   "NuevaOrdenPAgo.frx":7D70
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques Propios"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   22
         Left            =   360
         TabIndex        =   64
         Top             =   5040
         Width           =   4095
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   1
         Left            =   4800
         TabIndex        =   63
         Top             =   5040
         Width           =   1500
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Importe"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   21
         Left            =   360
         TabIndex        =   59
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Vencimiento"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   20
         Left            =   3840
         TabIndex        =   58
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Nro Cheque:"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   19
         Left            =   360
         TabIndex        =   56
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   0
         Left            =   3600
         TabIndex        =   54
         Top             =   360
         Width           =   3255
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Bco:"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   18
         Left            =   3120
         TabIndex        =   53
         Top             =   360
         Width           =   615
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Cta Corriente:"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   17
         Left            =   360
         TabIndex        =   51
         Top             =   360
         Width           =   1455
      End
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Fecha:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   24
      Left            =   8040
      TabIndex        =   74
      Top             =   240
      Width           =   855
   End
   Begin VB.Label Label1 
      BackColor       =   &H00FFFFFF&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label1"
      Height          =   285
      Index           =   6
      Left            =   2160
      TabIndex        =   13
      Top             =   240
      Width           =   5235
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Fletero:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   240
      TabIndex        =   11
      Top             =   240
      Width           =   855
   End
End
Attribute VB_Name = "NuevaOrdenPago"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim TNFactAplic As Double, TIVAFactAplic As Double, TGFactAplic As Double
Dim TNFactPend As Double, TIVAFactPend As Double, TGFactPend As Double
Dim TNComis  As Double, TIVAComis As Double, TComis As Double
Dim TEfvo As Double, TCHPropios As Double, TCHTerceros As Double, TAdel As Double, TGasOil As Double, TFalt As Double, CuentaCH_P As Integer, CuentaCH_T As Integer
Dim TPago As Double, TAPagar As Double, Diferencia As Double, TGAdelantos As Double, BuscLP As String
Dim ZEfvo As Double, ZCH_P As Double
Dim UltNro As String, FVto As String, FServD As String, FservH As String, FPago As String, VNetoFE As Double
Dim VivaFE As Double, FCte As String, VCUIT As String, VTipoDoc As Single, VIndice As Long, VtipoComp
Dim VCAE As String, VMOTIVO As String, VProceso As String, VNro As String
Private Sub Aceptar_Click()
Dim lPrimaryKey As Long, VNroAsiento As Long, VNroFactComis As Long
Dim VEjercicio As Long, VMes As Long
' On Error GoTo ERR_GrabaLP
If FormatNumber(Diferencia) = 0 Then
    Set rsEncabOP = db.OpenRecordset("SELECT * From EncabOP Order By NroOP")
    'rsEncabLP.Index = "PrimaryKey"
    Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
    Set rsCHEmitidos = db.OpenRecordset("ChEmitidos")
    Set rsAsientos = db.OpenRecordset("Asientos")
    Set rsDetLPCH_P = db.OpenRecordset("DetOPCHPropios")
    Set rsDetLPCHTer = db.OpenRecordset("DetOPCHT")
    Set rsAplicOP = db.OpenRecordset("AplicOP")
    Set rsDetOPAdel = db.OpenRecordset("DetOPAdel")
    
'graba encabezado orden de pago
    lPrimaryKey = GetPrimaryKey
    With rsEncabOP
        .AddNew
        .Fields("NroOP") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("CodProv") = Text1(0)
        .Fields("TotalOP") = TPago
        '.Fields("TNComis") = TNComis
        '.Fields("IVAComis") = TIVAComis
        '.Fields("TComis") = TComis
        .Fields("TAdelantos") = TAdel
        .Fields("TGasOil") = TGasOil
        .Fields("TFalt") = TFalt
        .Fields("TEfvo") = TEfvo
        .Fields("TCHPropio") = TCHPropios
        .Fields("TCHTerceros") = TCHTerceros
        .Update
    End With
    Set rsEncabOP = Nothing
    'graba detalle de adelantos y actualiza estados
    Items = 0
    For Items = Items + 1 To ListDescuentos.ListItems.Count
        Set Lista = ListDescuentos.ListItems.Item(Items)
        With rsDetOPAdel
            .AddNew
            .Fields("NroOP") = lPrimaryKey
            .Fields("NroRemito") = Lista.Tag
            .Fields("Efvo") = Lista.SubItems(1)
            .Fields("GasOil") = Lista.SubItems(2)
            .Fields("Faltante") = Lista.SubItems(3)
            .Update
        End With
        'acutaliza estado
        Set rsGasOilFleteros = db.OpenRecordset("Select * from GasOilFleteros Where CodFlet = " & Text1(0) & " And NroFact = " & Lista.Tag & " And PtoVta = " & Lista.SubItems(4) & "")
        If Not rsGasOilFleteros.EOF And Not rsGasOilFleteros.BOF Then
            If FormatNumber(rsGasOilFleteros.Fields("Importe")) = Lista.SubItems(2) Then
                rsGasOilFleteros.Edit
                rsGasOilFleteros.Fields("Descontada") = "SI"
                rsGasOilFleteros.Update
            Else
                rsGasOilFleteros.Edit
                rsGasOilFleteros.Fields("Importe") = rsGasOilFleteros.Fields("Importe") - Lista.SubItems(2)
                rsGasOilFleteros.Update
                If rsGasOilFleteros.Fields("Importe") = 0 Then
                    rsGasOilFleteros.Edit
                    rsGasOilFleteros.Fields("Descontada") = "SI"
                    rsGasOilFleteros.Update
                End If
            End If
        End If
        Set rsGasOilFleteros = Nothing
    Next
    Set rsDetOPAdel = Nothing
    'graba en cta cte del proveedor
    With rsCtaCteProv
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodProv") = Text1(0)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 11
        .Fields("Debe") = TPago
        .Fields("SaldoComp") = FormatNumber(Diferencia)
        .Update
    End With
    Set rsCtaCteProv = Nothing
    'actualiza saldo de facturas aplicadas
    i = 0
    For i = i + 1 To FactAplicadas.ListItems.Count
        Set Lista = FactAplicadas.ListItems.Item(i)
        Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where CodProv = " & Text1(0) & " and NroComp = " & Lista.Tag & " and PtoVta = " & Lista.SubItems(5) & " and TipoComp = " & Lista.SubItems(6) & "")
        Do While Not rsCtaCteProv.EOF
            If rsCtaCteProv!TipoComp = 60 Or rsCtaCteProv!TipoComp = 3 Then
                rsCtaCteProv.Edit
                rsCtaCteProv.LockEdits = True
                rsCtaCteProv.Fields("SaldoComp") = 0
                rsCtaCteProv.Update
                rsCtaCteProv.LockEdits = False
            End If
            rsCtaCteProv.MoveNext
        Loop
        rsAplicOP.AddNew
        rsAplicOP.Fields("NroOP") = lPrimaryKey
        rsAplicOP.Fields("PtoVta") = Lista.SubItems(5)
        rsAplicOP.Fields("NroFact") = Lista.Tag
        rsAplicOP.Fields("ImpAplic") = Lista.SubItems(4)
        rsAplicOP.Fields("TipoComp") = Lista.SubItems(6)
        rsAplicOP.Update
        'graba aplicacion de liquido producto en facturas
        'Set rsFactProv_Liq = db.OpenRecordset("Select * From FactProv_Liq Where CodProv = " & Text1(0) & " And NroFact = " & Lista.Tag & "")
        'rsFactProv_Liq.Edit
        'rsFactProv_Liq.LockEdits = True
        'rsFactProv_Liq.Fields("NroLP") = lPrimaryKey
        'rsFactProv_Liq.Update
        'rsFactProv_Liq.LockEdits = False
    Next
    Set rsCtaCteProv = Nothing
        If Not Text1(8) = "0.00" Then
        i = 0
        For i = i + 1 To ListCHP.ListItems.Count
            Set Lista = ListCHP.ListItems.Item(i)
            With rsCHEmitidos
            .AddNew
            .Fields("Fecha") = Lista.SubItems(3)
            .Fields("CtaCte") = Lista.Tag
            .Fields("CodComp") = 11
            .Fields("NroComp") = Lista.SubItems(2)
            .Fields("NroMov") = lPrimaryKey
            .Fields("Haber") = Lista.SubItems(4)
            .Fields("Estado") = "Pendiente"
            .Fields("FEmision") = Fecha
            .Fields("Dado") = Label1(6)
            .Fields("Adel") = Lista.SubItems(5)
            .Update
            End With
            Set rsCtaCteBco = db.OpenRecordset("CtaCteBco")
            With rsCtaCteBco
            .AddNew
            .Fields("Fecha") = Lista.SubItems(3)
            .Fields("CtaCte") = Lista.Tag
            .Fields("CodComp") = 1
            .Fields("NroComp") = Lista.SubItems(2)
            .Fields("NroMov") = Lista.SubItems(2)
            .Fields("Haber") = Lista.SubItems(4)
            .Fields("Conciliado") = False
            .Update
            End With
        With rsDetLPCH_P
            .AddNew
            .Fields("NroOP") = lPrimaryKey
            .Fields("Cuenta") = Lista.Tag
            .Fields("Importe") = Lista.SubItems(4)
            .Fields("Vto") = Lista.SubItems(3)
            .Fields("NroCH") = Lista.SubItems(2)
            .Update
        End With
        If Lista.SubItems(5) = "SI" Then
            Set rsDetAdelCHP = db.OpenRecordset("Select * From DetAdelCHP Where CodProv = " & Text1(0) & " AND NroCH = " & Lista.SubItems(2) & "")
            rsDetAdelCHP.Edit
            rsDetAdelCHP!Descontado = "SI"
            rsDetAdelCHP.Update
        End If
    Next
End If
Set rsDetLPCH_P = Nothing
Set rsCtaCteBco = Nothing
If Not Text1(9) = "0.00" Then
    i = 0
    For i = i + 1 To CHTerAplic.ListItems.Count
        Set Lista = CHTerAplic.ListItems.Item(i)
        With rsDetLPCHTer
            .AddNew
            .Fields("NroOP") = lPrimaryKey
            Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & Lista.SubItems(1) & "'")
            .Fields("CodBco") = rsBcos!CodBco
            .Fields("Vto") = Lista.SubItems(2)
            .Fields("Importe") = Lista.SubItems(3)
            .Fields("NroCH") = Lista.Tag
            .Update
        End With
        'actualiza estado cheque tercero
        Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where CodBanco = " & rsBcos!CodBco & " and NroCH = " & Lista.Tag & " and Estado = 'En Cartera'")
        rsChTer.Edit
        rsChTer.LockEdits = True
        rsChTer.Fields("Estado") = "Orden de Pago"
        rsChTer.Fields("Dado") = Label1(6)
        rsChTer.Fields("FEntregado") = Fecha
        rsChTer.Update
        rsChTer.LockEdits = False
        Set rsChTer = Nothing
        Set rsBcos = Nothing
        If Lista.SubItems(4) = "SI" Then
            Set rsDetAdelCHT = db.OpenRecordset("Select * From DetAdelCHT Where CodProv = " & Text1(0) & " AND NroCH = " & Lista.Tag & "")
            rsDetAdelCHT.Edit
            rsDetAdelCHT!Descontado = "SI"
            rsDetAdelCHT.Update
        End If
    Next
End If
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsEncabOP = Nothing
Set rsCtaCteProv = Nothing
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set rsCtaCteBco = Nothing
Set rsAsientos = Nothing
Set rsDetLPCH_P = Nothing
Set rsDetLPCHTer = Nothing
vflet = Label1(6)
Form_Load
Call Form_Load
    'factura grabada correctamente

With Msg_NuevaOP
    .Show
    .Height = 3105
    .Width = 6120
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
    '.NroFact = VNro
    .NroLP = lPrimaryKey
    .Text1 = vflet
End With

Exit Sub
Else
    MsgBox "La diferencia debe estar en cero(0)", vbInformation
    Exit Sub
End If
ERR_GrabaLP:
    TableError Err
    Set rsEncabLP = Nothing
    Set rsCtaCteProv = Nothing
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set rsCtaCteBco = Nothing
    Set rsAsientos = Nothing
    Set rsDetLPCH_P = Nothing
    Set rsDetLPCHTer = Nothing
End Sub
Private Function TableError(oErr As ErrObject) As Boolean
    Dim sMessage As String
    Dim nResponse As Integer
    ' estos son los cuatro códigos de error que se gestionarán especialmente
    ' dentro de esta función
    Const TB_OPEN = 3262            ' tabla ya abierta en modo compartido
    Const TB_IN_USE = 3261          ' tabla ya abierta en modo exclusivo
    Const TB_READ_ONLY = 3027       ' no se puede actualizar, sólo lectura
    Const TB_LOCKED = 3186          ' tabla bloqueada, no se puede actualizar
    Const DB_IN_USE = 3045  ' la base ya está abierta en modo exclusivo
    
    ' De manera predeterminada se asigna False como retorno de la función
    ' que significa que no se quiere volver a intentar
    TableError = False
    
    With oErr
        ' selecciona el código dependiendo del error
        Select Case .Number
            ' la tabla no pudo ser abierta en el modo requerido
            ' se pregunta al usuario si se quiere abrir en modo lectura
            Case TB_OPEN, TB_IN_USE:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
                'Exit Function
            ' la tabla es sólo lectura y no se pueden agregar registros
            Case TB_READ_ONLY:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está abierta de sólo lectura. "
                         
            ' la tabla está bloqueada y no se pueden agregar registros
            Case TB_LOCKED:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
            ' otro tipo de error: se visualiza el número y la descripción
            Case DB_IN_USE
                SMSSAGE = "ABIERTA EN FORMA ESCLUSIVA POR OTRO USUARIO"
                ' del error
            Case Else
                sMessage = "Error #" & .Number & ": " & .Description
        End Select
    End With
    ' visualiza el mensaje de error
    MsgBox sMessage, vbExclamation, "TABLA ERROR"
    
    ' ha habido un error y nos aseguramos que la tabla queda cerrada
    ' y en la pantalla quedan las etiquetas adecuadas
    'Set rs = Nothing
End Function

Private Sub AgregarCHP_Click()
On Error Resume Next
Dim lista1 As ListItem

If Not IsNumeric(Text2(1)) Then
    MsgBox "Datos Incorrecto", vbInformation
    Text2(1).SetFocus
    Exit Sub
ElseIf VtoCHPropio.Text = "__/__/___" Then
    MsgBox "Datos Incorrecto", vbInformation
    VtoCHPropio.SetFocus
    Exit Sub
ElseIf Text2(2) = "" Or Text2(2) = "0.00" Or Not IsNumeric(Text2(2)) Then
    MsgBox "Datos Incorrecto", vbInformation
    Text2(2).SetFocus
    Exit Sub
End If
'controla que no este en la lista
If Not CuentaCH_P = 0 Then
    i = 0
    For i = i + 1 To CuentaCH_P
    Set lista1 = ListCHP.ListItems.Item(i)
    If lista1.SubItems(2) = Text2(1) Then
        MsgBox "El cheque ya esta cargado en la lista"
        Exit Sub
    End If
    Next
End If
CuentaCH_P = 0
'If CuentaCH_P < 15 Then
    Set Lista = ListCHP.ListItems.Add(, , Text2(0))
    Lista.Tag = Text2(0)
    Lista.SubItems(1) = Label2(0)
    Lista.SubItems(2) = Text2(1)
    Lista.SubItems(3) = VtoCHPropio
    Lista.SubItems(4) = FormatNumber(Text2(2))
    Lista.SubItems(5) = "NO"
    TCHPropios = TCHPropios + Text2(2)
    TPago = TPago + FormatNumber(Text2(2))
    Diferencia = TAPagar - TPago
    ZCH_P = Text2(2)
    Label2(1) = FormatNumber(TCHPropios)
    Text1(8) = FormatNumber(TCHPropios)
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    i = 0
    For i = i + 1 To Text2.Count
      If Not i = 3 Then
         Text2(i - 1) = ""
     Else
        Text2(i - 1) = "0.00"
    End If
    Next
    Label2(0) = ""
    VtoCHPropio.Mask = ""
    VtoCHPropio.Text = ""
    VtoCHPropio.Mask = "##/##/####"
    CuentaCH_P = CuentaCH_P + 1
    Text2(0).SetFocus
'Else
 '   MsgBox "No puede cargar más de 4 cheques"
'End If
End Sub

Private Sub AgregarDesc_Click()
If Not Text1(16) = "" Then
    Set Lista = ListDescuentos.ListItems.Add(, , Text1(16))
        Lista.Tag = Text1(16)
        Lista.SubItems(1) = FormatNumber(Text1(17))
        Lista.SubItems(2) = FormatNumber(Text1(18))
        Lista.SubItems(3) = FormatNumber(Text1(19))
        Lista.SubItems(4) = Text1(21)
    TDescuentos = TDescuentos + Text1(17) + Text1(18) + Text1(19)
    TAdel = TAdel + Text1(17)
    TGasOil = TGasOil + Text1(18)
    TFalt = TFalt + Text1(19)
    TPago = TPago + Text1(17) + Text1(18) + Text1(19)
    Text1(10) = FormatNumber(TAdel)
    Text1(11) = FormatNumber(TGasOil)
    Text1(12) = FormatNumber(TFalt)
    Diferencia = TAPagar - TPago
    Text1(13) = FormatNumber(TPago)
    Diferencia = TAPagar - TPago
    Text1(14) = FormatNumber(Diferencia)
    Text1(20) = FormatNumber(TDescuentos)
    Text1(16) = "": Text1(17) = "0.00": Text1(18) = "0.00": Text1(19) = "0.0": Text1(21) = ""
    
Else
    MsgBox "Nro Remito es obligatorios", vbInformation
    Text1(24).SetFocus
End If

End Sub

Private Sub Cancelar_Click()
Form_Initialize
Form_Load
End Sub

Private Sub CargarDesc_Click()
On Error Resume Next
Descuentos.Visible = True
Frame1.Visible = False: Frame2.Visible = False
CHPropios.Visible = False: ChTerceros.Visible = False
Text1(15).Locked = False
i = Len(Text1(15))
Text1(15).SelStart = 0
Text1(15).SelLength = i
Text1(15).SetFocus
End Sub

Private Sub ChCartera_DblClick()
Dim X As ListItem
    Set X = ChCartera.ListItems.Item(ChCartera.SelectedItem.Index)
    Set Lista = CHTerAplic.ListItems.Add(, , X.Tag)
    Lista.Tag = X.Tag
    Lista.SubItems(1) = X.SubItems(1)
    Lista.SubItems(2) = X.SubItems(2)
    Lista.SubItems(3) = X.SubItems(3)
    TCHTerceros = TCHTerceros + X.SubItems(3)
    TPago = TPago + X.SubItems(3)
    Diferencia = TAPagar - TPago
    Text1(9) = FormatNumber(TCHTerceros)
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    Label3 = FormatNumber(TCHTerceros)
    CuentaCH_T = CuentaCH_T + 1
    ChCartera.ListItems.Remove (ChCartera.SelectedItem.Index)

End Sub

Private Sub CHPAdel_DblClick()
Dim lista1 As ListItem
If CuentaCH_P < 15 Then
Set lista1 = CHPAdel.ListItems.Item(CHPAdel.SelectedItem.Index)
Set Lista = ListCHP.ListItems.Add(, , lista1.Tag)
Lista.Tag = lista1.Tag
Lista.SubItems(1) = lista1.SubItems(1)
Lista.SubItems(2) = lista1.SubItems(2)
Lista.SubItems(3) = lista1.SubItems(3)
Lista.SubItems(4) = lista1.SubItems(4)
Lista.SubItems(5) = "SI"
TCHPropios = TCHPropios + lista1.SubItems(4)
TPago = TPago + FormatNumber(Lista.SubItems(4))
Diferencia = TAPagar - TPago
ZCH_P = lista1.SubItems(4)
Label2(1) = FormatNumber(TCHPropios)
Text1(8) = FormatNumber(TCHPropios)
Text1(13) = FormatNumber(TPago)
Text1(14) = FormatNumber(Diferencia)
CHPAdel.ListItems.Remove (CHPAdel.SelectedItem.Index)
CuentaCH_P = CuentaCH_P + 1
End If
End Sub

Private Sub DescPendientes_DblClick()
Set LDescGO = DescPendientes.ListItems.Item(DescPendientes.SelectedItem.Index)
Text1(21) = LDescGO.SubItems(1)
Text1(16) = LDescGO.SubItems(2)
Text1(18) = LDescGO.SubItems(3)
Text1(17) = "0.00"
Text1(19) = "0.00"
DescPendientes.ListItems.Remove (DescPendientes.SelectedItem.Index)

End Sub

Private Sub FacturasPend_DblClick()
On Error Resume Next
Dim FactAplic As ListItem
Set Lista = FacturasPend.ListItems.Item(FacturasPend.SelectedItem.Index)
Set FactAplic = FactAplicadas.ListItems.Add(, , Lista.Tag)
FactAplic.Tag = Lista.Tag
FactAplic.SubItems(1) = Lista.SubItems(1)
FactAplic.SubItems(2) = Lista.SubItems(2)
FactAplic.SubItems(3) = Lista.SubItems(3)
FactAplic.SubItems(4) = Lista.SubItems(4)
FactAplic.SubItems(5) = Lista.SubItems(5)
FactAplic.SubItems(6) = Lista.SubItems(6)
'calcula totales facturas pendientes
TNFactPend = TNFactPend - Lista.SubItems(2)
TIVAFactPend = TIVAFactPend - Lista.SubItems(3)
TGFactPend = TGFactPend - Lista.SubItems(4)
Label1(0) = FormatNumber(TGFactPend)
Label1(1) = FormatNumber(TIVAFactPend)
Label1(2) = FormatNumber(TNFactPend)
'calcula totales facturas aplicadas
TNFactAplic = TNFactAplic + Lista.SubItems(2)
TIVAFactAplic = TIVAFactAplic + Lista.SubItems(3)
TGFactAplic = TGFactAplic + Lista.SubItems(4)
Label1(3) = FormatNumber(TGFactAplic)
Label1(4) = FormatNumber(TIVAFactAplic)
Label1(5) = FormatNumber(TNFactAplic)
Text1(1) = FormatNumber(TNFactAplic)
Text1(2) = FormatNumber(TIVAFactAplic)
Text1(3) = FormatNumber(TGFactAplic)
'busca comision correspondiente a cada liquidacion de las facturas
'Set rsFactProv_Liq = db.OpenRecordset("Select * from FactProv_Liq where CodProv = " & Text1(0) & " and NroFact = " & Lista.Tag & " and PtoVta = " & Lista.SubItems(5) & "")
'Do While Not rsFactProv_Liq.EOF
'    Set rsEncabLiq = db.OpenRecordset("Select * from EncabLiquidacion Where NroLiq = " & rsFactProv_Liq!NroLiq & "")
'    TNComis = TNComis + rsEncabLiq!TNetoComis
'    TIVAComis = TIVAComis + rsEncabLiq!TIVAComis
'    TComis = TComis + rsEncabLiq!TComis
    'busca detalle de la liquidacion
    'Set rsLiqDetDesc = db.OpenRecordset("Select * from LiqDetDescuentos Where NroLiq = " & rsFactProv_Liq!NroLiq & "")
   ' Do While Not rsLiqDetDesc.EOF
   '     TAdel = TAdel + rsLiqDetDesc!Efvo
   '     TGasOil = TGasOil + rsLiqDetDesc.Fields("Gas-Oil")
   '     TFalt = TFalt + rsLiqDetDesc!Faltante
   '     rsLiqDetDesc.MoveNext
   ' Loop
   ' rsFactProv_Liq.MoveNext
'Loop
'Set rsFactProv_Liq = Nothing
'Set rsEncabLiq = Nothing
'Set rsLiqDetDesc = Nothing
'Text1(4) = FormatNumber(TComis)
'Text1(5) = FormatNumber(TIVAComis)
'Text1(6) = FormatNumber(TNComis)
Text1(10) = FormatNumber(TAdel)
Text1(11) = FormatNumber(TGasOil)
Text1(12) = FormatNumber(TFalt)
TAPagar = TGFactAplic
'TPago = TComis + TAdel + TGasOil + TFalt
Diferencia = TAPagar - TPago
Text1(13) = FormatNumber(TPago)
Text1(14) = FormatNumber(Diferencia)

FacturasPend.ListItems.Remove (FacturasPend.SelectedItem.Index)
End Sub

Private Sub Form_Initialize()
Set rsFleteros = Nothing
Set rsCtaCteProv = Nothing
Set rsEncabFactProv = Nothing
Set rsFactProv_Liq = Nothing
Set rsEncabLiq = Nothing
Set rsLiqDetDesc = Nothing
Set rsCtaBcoPropias = Nothing
Set rsCtaCteBco = Nothing
Set rsEncabLP = Nothing
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set rsAsientos = Nothing
Set rsDetLPCHTer = Nothing
TDescuentos = 0
End Sub
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabOP
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroOP") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function
Private Function GetFactComis()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFact
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetFactComis = .Fields("NroFact") + 1
            
        Else
            
            GetFactComis = 1
        
        End If
        
    End With
End Function
Private Function GetNroAsiento()
' Devuelve una clave única basada en el número de cliente
    With rsAsientos
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetNroAsiento = .Fields("NroAsiento") + 1
            
        Else
            
            GetNroAsiento = 1
        
        End If
        
    End With
End Function
Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
    Case vbKeyF3: Call Buscar
    Case vbKeyF5: Call Aceptar_Click
End Select
End Sub
Private Sub Buscar()
If BuscLP = "Fletero" Then
    With BuscFlet
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "LP"
    End With
End If
End Sub
Private Sub Form_Load()
On Error Resume Next
Frame1.Visible = True: Frame2.Visible = True
CHPropios.Visible = False: ChTerceros.Visible = False
TNFactAplic = 0: TIVAFactAplic = 0: TGFactAplic = 0
TNFactPend = 0: TIVAFactPend = 0: TGFactPend = 0
TNComis = 0: TIVAComis = 0: TComis = 0
TEfvo = 0: TCHPropios = 0: TCHTerceros = 0: TAdel = 0: TGasOil = 0: TFalt = 0: TPago = 0: TAPagar = 0: Diferencia = 0
CuentaCH_P = 0: CuentaCH_T = 0
Fecha = Date
ZEfvo = 0: ZCH_P = 0
i = 0
For i = i + 1 To Text1.Count
    If i = 1 Then
        Text1(i - 1) = ""
    Else
        Text1(i - 1) = "0.00"
        Text1(i - 1).Locked = False
    End If
Next
i = 0
For i = i + 1 To Text2.Count
    If Not i = 3 Then
        Text2(i - 1) = ""
    Else
        Text2(i - 1) = "0.00"
    End If
Next
Label2(0) = "": Label2(1) = "0.00": Label3 = "0.00"
VtoCHPropio.Mask = ""
VtoCHPropio.Text = ""
VtoCHPropio.Mask = "##/##/####"
i = 0
For i = i + 1 To Label1.Count
    If i = 7 Then
        Label1(i - 1) = ""
    Else
        Label1(i - 1) = "0.00"
    End If
Next
ListCHP.ListItems.Clear
CHPAdel.ListItems.Clear
ChCartera.ListItems.Clear
Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where Estado = 'En Cartera' Order By FechaVto")
Do While Not rsChTer.EOF
    Set Lista = ChCartera.ListItems.Add(, , rsChTer!NroCH)
        Lista.Tag = rsChTer!NroCH
        Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsChTer!CodBanco & "")
        Lista.SubItems(1) = rsBcos!DescBco
        Set rsBcos = Nothing
        Lista.SubItems(2) = rsChTer!FechaVto
        Lista.SubItems(3) = FormatNumber(rsChTer!Importe)
    rsChTer.MoveNext
Loop
Set rsChTer = Nothing
BuscLP = "Fletero"
End Sub

Private Sub KewlButtons1_Click()
Descuentos.Visible = False
Frame1.Visible = False: Frame2.Visible = False
CHPropios.Visible = True: ChTerceros.Visible = False
End Sub

Private Sub KewlButtons2_Click(Index As Integer)
Frame1.Visible = False: Frame2.Visible = False
CHPropios.Visible = False: ChTerceros.Visible = True

End Sub

Private Sub KewlButtons3_Click()
Frame1.Visible = True: Frame2.Visible = True
CHPropios.Visible = False: ChTerceros.Visible = False
End Sub

Private Sub LCHTAdel_DblClick()
Dim X As ListItem
    Set X = LCHTAdel.ListItems.Item(LCHTAdel.SelectedItem.Index)
    Set Lista = CHTerAplic.ListItems.Add(, , X.Tag)
    Lista.Tag = X.Tag
    Lista.SubItems(1) = X.SubItems(1)
    Lista.SubItems(2) = X.SubItems(2)
    Lista.SubItems(3) = X.SubItems(3)
    Lista.SubItems(4) = "SI"
    TCHTerceros = TCHTerceros + X.SubItems(3)
    TPago = TPago + X.SubItems(3)
    Diferencia = TAPagar - TPago
    Text1(9) = FormatNumber(TCHTerceros)
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    Label3 = FormatNumber(TCHTerceros)
    CuentaCH_T = CuentaCH_T + 1
    LCHTAdel.ListItems.Remove (LCHTAdel.SelectedItem.Index)

End Sub

Private Sub ListCHP_DblClick()
Dim lista1 As ListItem
If CuentaCH_P < 15 Then
Set lista1 = ListCHP.ListItems.Item(ListCHP.SelectedItem.Index)
Set Lista = CHPAdel.ListItems.Add(, , lista1.Tag)
Lista.Tag = lista1.Tag
Lista.SubItems(1) = lista1.SubItems(1)
Lista.SubItems(2) = lista1.SubItems(2)
Lista.SubItems(3) = lista1.SubItems(3)
Lista.SubItems(4) = lista1.SubItems(4)
'Lista.SubItems(5) = "SI"
TCHPropios = TCHPropios - lista1.SubItems(4)
TPago = TPago - FormatNumber(Lista.SubItems(4))
Diferencia = TAPagar + TPago
ZCH_P = lista1.SubItems(4)
Label2(1) = FormatNumber(TCHPropios)
Text1(8) = FormatNumber(TCHPropios)
Text1(13) = FormatNumber(TPago)
Text1(14) = FormatNumber(Diferencia)
ListCHP.ListItems.Remove (ListCHP.SelectedItem.Index)
CuentaCH_P = CuentaCH_P - 1
End If

End Sub

Private Sub Text1_LostFocus(Index As Integer)
On Error Resume Next
Select Case Index
Case 0:
If Not Text1(0) = "" Then
    Set rsFleteros = db.OpenRecordset("Select * from Fleteros where CodFlet = " & Text1(0) & "")
    Label1(6) = rsFleteros!DescFlet
    'busca facturas pendientes
    Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where CodProv = " & Text1(0) & " and SaldoComp > 0")
    FacturasPend.ListItems.Clear
    Do While Not rsCtaCteProv.EOF
        If rsCtaCteProv!TipoComp = 60 Then
            Set rsEncabLP = db.OpenRecordset("SELECT * FROM Encablprod WHERE NroComp = " & rsCtaCteProv!NroComp & "")
            Set Lista = FacturasPend.ListItems.Add(, , rsEncabLP!NroComp)
            Lista.Tag = rsEncabLP!NroComp
            Lista.SubItems(1) = rsEncabLP!Fecha
            Lista.SubItems(2) = FormatNumber(rsEncabLP!netoviajes)
            TNFactPend = TNFactPend + rsEncabLP!netoviajes
            Lista.SubItems(3) = FormatNumber(rsEncabLP!ivaviaje)
            TIVAFactPend = TIVAFactPend + rsEncabLP!ivaviaje
            Lista.SubItems(4) = FormatNumber(rsCtaCteProv!SaldoComp) '('rsEncabLP!totalviajes1)
            TGFactPend = TGFactPend + rsCtaCteProv!SaldoComp 'rsEncabLP!totalviajes1
            Lista.SubItems(5) = rsEncabLP!PtoVta
            Lista.SubItems(6) = rsCtaCteProv!TipoComp
        Else
            Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabFactProv WHERE CodProv = " & Text1(0) & " AND NroFact = " & rsCtaCteProv!NroComp & " AND PtoVta = " & rsCtaCteProv!PtoVta & " and CodComp = " & rsCtaCteProv!TipoComp & "")
            Do While Not rsEncabFactProv.EOF
                Set Lista = FacturasPend.ListItems.Add(, , rsEncabFactProv!NroFact)
                Lista.Tag = rsEncabFactProv!NroFact
                Lista.SubItems(1) = rsEncabFactProv!Fecha
                Lista.SubItems(2) = FormatNumber(rsEncabFactProv!TotalNeto)
                TNFactPend = TNFactPend + rsEncabFactProv!TotalNeto
                Lista.SubItems(3) = FormatNumber(rsEncabFactProv!IVA)
                TIVAFactPend = TIVAFactPend + rsEncabFactProv!IVA
                Lista.SubItems(4) = FormatNumber(rsEncabFactProv!total)
                TGFactPend = TGFactPend + rsEncabFactProv!total
                Lista.SubItems(5) = rsEncabFactProv!PtoVta
                Lista.SubItems(6) = rsCtaCteProv!TipoComp
                rsEncabFactProv.MoveNext
            Loop
        End If
        rsCtaCteProv.MoveNext
    Loop
    Label1(0) = FormatNumber(TGFactPend)
    Label1(1) = FormatNumber(TIVAFactPend)
    Label1(2) = FormatNumber(TNFactPend)
    'busca cheques adelantados
    Set rsDetAdelCHP = db.OpenRecordset("Select * From DetAdelCHP Where CodProv = " & Text1(0) & " AND Descontado = 'NO'")
    Do While Not rsDetAdelCHP.EOF
        Set Lista = CHPAdel.ListItems.Add(, , rsDetAdelCHP!Cuenta)
        Lista.Tag = rsDetAdelCHP!Cuenta
        Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & rsDetAdelCHP!Cuenta & "'")
        Lista.SubItems(1) = rsCtaBcoPropias!DescBco
        Lista.SubItems(2) = rsDetAdelCHP!NroCH
        Lista.SubItems(3) = rsDetAdelCHP!Vto
        Lista.SubItems(4) = FormatNumber(rsDetAdelCHP!Importe)
        rsDetAdelCHP.MoveNext
    Loop
    Set rsDetAdelCHT = db.OpenRecordset("Select * From DetAdelCHT Where CodProv = " & Text1(0) & " AND Descontado = 'NO'")
    Do While Not rsDetAdelCHT.EOF
    Set Lista = LCHTAdel.ListItems.Add(, , rsDetAdelCHT!NroCH)
        Lista.Tag = rsDetAdelCHT!NroCH
        Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsDetAdelCHT!CodBco & "")
        Lista.SubItems(1) = rsBcos!DescBco
        Set rsBcos = Nothing
        Lista.SubItems(2) = rsDetAdelCHT!Vto
        Lista.SubItems(3) = FormatNumber(rsDetAdelCHT!Importe)
        rsDetAdelCHT.MoveNext
    Loop
    'adelantos de gas oil
    DescPendientes.ListItems.Clear
    Set rsGasOilFleteros = db.OpenRecordset("SELECT * FROM GasOilFleteros WHERE CodFlet = " & Text1(0) & "")
    Do While Not rsGasOilFleteros.EOF
    If rsGasOilFleteros!codflet = Text1(0) And rsGasOilFleteros!Descontada = "NO" Then
        Set LDescGO = DescPendientes.ListItems.Add(, , rsGasOilFleteros!Fecha)
        LDescGO.Tag = rsGasOilFleteros.Fields("Fecha")
        LDescGO.SubItems(1) = rsGasOilFleteros.Fields("PtoVta")
        LDescGO.SubItems(2) = rsGasOilFleteros.Fields("NroFact")
        LDescGO.SubItems(3) = FormatNumber(rsGasOilFleteros.Fields("Importe"))
    End If
        rsGasOilFleteros.MoveNext
    Loop
    Set rsGasOilFleteros = Nothing
End If
Set rsFleteros = Nothing
Set rsCtaCteProv = Nothing
Set rsEncabFactProv = Nothing
Case 15:
    TPago = TPago - ZEfvo + Text1(15)
    TEfvo = TEfvo - ZEfvo + Text1(15)
    Diferencia = TAPagar - TPago
    Text1(7) = FormatNumber(TEfvo)
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    Text1(7).Locked = True
    ZEfvo = Text1(15)

End Select
End Sub

Private Sub Text2_GotFocus(Index As Integer)
If Index = 2 Then
    i = Len(Text2(2))
    Text2(2).SelStart = 0
    Text2(2).SelLength = i
    Text2(2).SetFocus
End If
End Sub

Private Sub Text2_LostFocus(Index As Integer)
On Error Resume Next
Select Case Index
Case 0:
    If Not Text2(0) = "" Then
        Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & Text2(0) & "'")
        If Not rsCtaBcoPropias.EOF And Not rsCtaBcoPropias.BOF Then
            Label2(0) = rsCtaBcoPropias!DescBco
        Else
            MsgBox "La Cuenta no existe", vbInformation
            Text2(0).Text = ""
            Text2(0).SetFocus
        End If
        Set rsCtaBcoPropias = Nothing
    End If
Case 1:
   Set rsCHEmitidos = db.OpenRecordset("Select * From CHEmitidos Where CtaCte = '" & Text2(1) & "' and NroComp = " & Text2(1) & "")
   If Not rsCHEmitidos.EOF And Not rsCHEmitidos.BOF Then
        MsgBox "EL CHEQUE YA FUE EMITIDO"
        Text2(1) = ""
    End If
End Select
End Sub

Private Sub Volver_Click()
CHPropios.Visible = False
Frame1.Visible = True
Frame2.Visible = True
End Sub

Private Sub VtoCHPropio_LostFocus()
If Not IsDate(VtoCHPropio) Then
    MsgBox "Fecha Incorecta", vbInformation
    VtoCHPropio.Mask = ""
    VtoCHPropio.Text = ""
    VtoCHPropio.Mask = "##/##/####"
    VtoCHPropio.SetFocus
End If
End Sub
