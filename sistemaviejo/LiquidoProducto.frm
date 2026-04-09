VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{F9043C88-F6F2-101A-A3C9-08002B2F49FB}#1.2#0"; "COMDLG32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{757B5B41-998B-41F8-95D8-B90E12A1D40B}#240.0#0"; "WSAFIPFEOCX.ocx"
Begin VB.Form LiquidoProducto 
   BackColor       =   &H80000007&
   Caption         =   "Liquido Producto"
   ClientHeight    =   9555
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   13485
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   9555
   ScaleWidth      =   13485
   Begin WSAFIPFEOCX.WSAFIPFEx FE1 
      Left            =   11280
      Top             =   240
      _ExtentX        =   2355
      _ExtentY        =   661
   End
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
      Caption         =   "Detalle Líquido Producto"
      ForeColor       =   &H000040C0&
      Height          =   8655
      Left            =   7560
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
            Height          =   1815
            Left            =   120
            TabIndex        =   40
            Top             =   240
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
            Top             =   4680
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   12
            Left            =   3960
            TabIndex        =   36
            Text            =   "Text1"
            Top             =   4200
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   11
            Left            =   3960
            TabIndex        =   35
            Text            =   "Text1"
            Top             =   3840
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   10
            Left            =   3960
            TabIndex        =   34
            Text            =   "Text1"
            Top             =   3480
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   9
            Left            =   3960
            TabIndex        =   33
            Text            =   "Text1"
            Top             =   3120
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   8
            Left            =   3960
            TabIndex        =   32
            Text            =   "Text1"
            Top             =   2760
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   7
            Left            =   3960
            TabIndex        =   31
            Text            =   "Text1"
            Top             =   2400
            Width           =   1050
         End
         Begin VB.Line Line3 
            BorderColor     =   &H000040C0&
            X1              =   3840
            X2              =   5160
            Y1              =   4560
            Y2              =   4560
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
            Top             =   4680
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
            Top             =   4200
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
            Top             =   3840
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
            Top             =   3480
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
            Top             =   3120
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
            Top             =   2760
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
            Top             =   2400
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
      MICON           =   "LiquidoProducto.frx":0000
      PICN            =   "LiquidoProducto.frx":001C
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
      MICON           =   "LiquidoProducto.frx":0336
      PICN            =   "LiquidoProducto.frx":0352
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
      MICON           =   "LiquidoProducto.frx":066C
      PICN            =   "LiquidoProducto.frx":0688
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
      MICON           =   "LiquidoProducto.frx":09A2
      PICN            =   "LiquidoProducto.frx":09BE
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
      MICON           =   "LiquidoProducto.frx":2A40
      PICN            =   "LiquidoProducto.frx":2A5C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
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
         NumItems        =   6
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
         NumItems        =   6
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
         MICON           =   "LiquidoProducto.frx":2FF6
         PICN            =   "LiquidoProducto.frx":3012
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
         MICON           =   "LiquidoProducto.frx":5094
         PICN            =   "LiquidoProducto.frx":50B0
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
         MICON           =   "LiquidoProducto.frx":53CA
         PICN            =   "LiquidoProducto.frx":53E6
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
Attribute VB_Name = "LiquidoProducto"
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
Private Sub Genera_FE()
On Error Resume Next
Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 16 order by NroFe")
Set rsDetFact = db.OpenRecordset("DetFE")
Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
'limpia temporales
Do While Not TrsEncabFact.EOF
    TrsEncabFact.Delete
    TrsEncabFact.MoveNext
Loop
Do While Not TrsDetFact.EOF
    TrsDetFact.Delete
    TrsDetFact.MoveNext
Loop
'busca número Factura
rsEncabFact.MoveLast
lPrimaryKey = rsEncabFact.Fields("NroFE") + 1
'lPrimaryKey = GetPrimaryKey
VNro = lPrimaryKey
'GENERA CAE
'llena variables
Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 16")
UltNro = rsComprobantes!UltNro
FVto = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FServD = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FservH = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FPago = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
VNetoFE = FormatNumber(TNComis)
VivaFE = FormatNumber(TIVAComis)
FCte = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
Set rsFleteros = db.OpenRecordset("SELECT * FROM Fleteros WHERE Codflet = " & Text1(0) & "")
VCUIT = Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
VTipoDoc = 80
VtipoComp = 1
Set rsEncabFact = Nothing
Set rsEncabFact = db.OpenRecordset("Select * from EncabFE order by indice")
If rsEncabFact.EOF Then
    VIndice = 0
Else
    rsEncabFact.MoveLast
    VIndice = rsEncabFact!indice + 1
End If
    
With rsEncabFact
    .AddNew
    .Fields("Indice") = VIndice
    .Fields("PtoVtaFE") = 4
    .Fields("NroFE") = lPrimaryKey
    .Fields("FechaFE") = Fecha
    .Fields("CodClie") = Text1(0)
    .Fields("TotalNetoFE") = VNetoFE
    .Fields("TotalIvaFE") = VivaFE
    .Fields("TotalGralFE") = TComis
    .Fields("TipoAfip") = 1
    .Fields("TipoSistema") = 16
    .Fields("FVto") = FVto
    .Fields("FservD") = FServD
    .Fields("FservH") = FservH
    .Fields("FPago") = FPago
    .Fields("ClaseFact") = 2 '1 - Factura Viajes, 2- Factura de Comisión
    Call genera_cae1
    If FE1.F1RespuestaDetalleResultado = "A" Then
        .Fields("CAE") = FE1.F1RespuestaDetalleCae
        .Fields("VtoCAE") = FE1.F1RespuestaDetalleCAEFchVto
        .Fields("ObsCAE") = FE1.F1RespuestaDetalleResultado
        .Fields("MotivoCAE") = FE1.F1RespuestaDetalleObservacionMsg
    Else
        MsgBox "Rechazado:" + FE1.F1RespuestaDetalleObservacionMsg1
    End If
    .Update
End With
'graba encabezado en temporales
With TrsEncabFact
    .AddNew
    largo = Len(VNro)
    Select Case largo
        Case 1: NRO = "0000000" & VNro
        Case 2: NRO = "000000" & VNro
        Case 3: NRO = "00000" & VNro
        Case 4: NRO = "0000" & VNro
        Case 5: NRO = "000" & VNro
        Case 6: NRO = "00" & VNro
        Case 7: NRO = "0" & VNro
        Case 8: NRO = VNro
    End Select
    .Fields("NroFact") = lPrimaryKey
    .Fields("Fecha") = Fecha
    .Fields("Codigo") = Text1(0)
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(0) & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
    .Fields("TipoFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
    .Fields("TNeto") = FormatNumber(TNComis)
    .Fields("TIVA") = FormatNumber(TIVAComis)
    .Fields("TGral") = FormatNumber(TComis)
    .Fields("CAE") = Me.FE1.F1RespuestaDetalleCae
    .Fields("ObsCAE") = FE1.F1RespuestaDetalleResultado
    DIA = Mid(FE1.F1RespuestaDetalleCAEFchVto, 7, 2)
    MES = Mid(FE1.F1RespuestaDetalleCAEFchVto, 5, 2)
    AÑO = Mid(FE1.F1RespuestaDetalleCAEFchVto, 1, 4)
    FVTOCAE = DIA & "/" & MES & "/" & AÑO
    .Fields("VtoCAE") = FVTOCAE
    .Fields("MotivoCAE") = FE1.F1RespuestaDetalleResultado
    .Fields("NroFE") = NRO
    .Fields("PtoVtaFE") = "0004"
    .Update
End With
End Sub

Private Sub genera_cae1()
If FE1.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   FE1.ArchivoCertificadoPassword = "hercasa1509"
   If FE1.f1ObtenerTicketAcceso() Then
      FE1.F1CabeceraCantReg = 1
      FE1.F1CabeceraPtoVta = 4
      FE1.F1CabeceraCbteTipo = VtipoComp

      FE1.f1Indice = 0
      FE1.F1DetalleConcepto = 2
      FE1.F1DetalleDocTipo = VTipoDoc
      FE1.F1DetalleDocNro = VCUIT
      FE1.F1DetalleCbteDesde = VNro
      FE1.F1DetalleCbteHasta = VNro
      FE1.F1DetalleCbteFch = FCte
      FE1.F1DetalleImpTotal = FormatNumber(TComis)
      FE1.F1DetalleImpTotalConc = 0
      FE1.F1DetalleImpNeto = FormatNumber(VNetoFE)
      FE1.F1DetalleImpOpEx = 0
      FE1.F1DetalleImpTrib = 0
      FE1.F1DetalleImpIva = FormatNumber(TIVAComis)
      FE1.F1DetalleFchServDesde = FServD
      FE1.F1DetalleFchServHasta = FservH
      FE1.F1DetalleFchVtoPago = FPago
      FE1.F1DetalleMonIdS = "PES"
      FE1.F1DetalleMonCotiz = 1
      FE1.F1DetalleIvaItemCantidad = 1
      FE1.f1IndiceItem = 0
      FE1.F1DetalleIvaId = 5
      FE1.F1DetalleIvaBaseImp = FormatNumber(VNetoFE)
      FE1.F1DetalleIvaImporte = FormatNumber(TIVAComis)

      'FE.F1DetalleTributoItemCantidad = 1
      'FE.f1IndiceItem = 0
      'FE.F1DetalleTributoId = 3
      'FE.F1DetalleTributoDesc = ""
      'FE.F1DetalleTributoBaseImp = 0
      'FE.F1DetalleTributoAlic = 0
      'FE.F1DetalleTributoImporte = 0

      'FE.f1IndiceItem = 1
      'FE.F1DetalleIvaId = 4
      'FE.F1DetalleIvaBaseImp = 0
      'FE.F1DetalleIvaImporte = 0


      FE1.F1DetalleCbtesAsocItemCantidad = 0
      FE1.F1DetalleOpcionalItemCantidad = 0

      FE1.ArchivoXMLRecibido = App.Path + "\recibido.xml"
      FE1.ArchivoXMLEnviado = App.Path + "\enviado.xml"

      lResultado = FE1.F1CAESolicitar()
      
     If lResultado Then
        
         MsgBox ("Factura Generada")
      Else
         MsgBox ("Error de Solicitud de CAE")
      End If
      'MsgBox ("error local: " + FE1.UltimoMensajeError)
      'MsgBox ("resultado global AFIP: " + FE1.F1RespuestaResultado)
      
      'MsgBox ("es reproceso? " + FE1.F1RespuestaReProceso)
      'MsgBox ("registros procesados por AFIP: " + Str(FE1.F1RespuestaCantidadReg))
      'MsgBox ("error genérico global:" + FE.f1ErrorMsg1)
      If FE1.F1RespuestaCantidadReg > 0 Then
        'FE.f1Indice = 0
        'MsgBox ("resultado detallado comprobante: " + FE.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + FE.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + FE.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + FE.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + FE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + FE.UltimoMensajeError)
End If

End Sub
Private Sub Genera_CAE()

Dim bResultado As Boolean
Dim cIdentificador As String
'ActivarLicenciaSiNoExiste("30709381683",App.Path + "\Certificado\WSAFIPFE.lic","","alvarez2016")
bResultado = Me.FE1.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic")

Me.FE1.ArchivoCertificadoPassword = "hercasa1509"
If bResultado Then
    bResultado = Me.FE1.ObtenerTicketAcceso()
End If
  If bResultado Then
     Me.FE1.FECabeceraCantReg = 1
     Me.FE1.FECabeceraPresta_serv = 1
     Me.FE1.indice = UltNro
     Me.FE1.FEDetalleFecha_vence_pago = FVto
     Me.FE1.FEDetalleFecha_serv_desde = FServD
     Me.FE1.FEDetalleFecha_serv_hasta = FservH
     Me.FE1.FEDetalleFecha_vence_pago = FPago
     Me.FE1.FEDetalleImp_neto = VNetoFE
     Me.FE1.FEDetalleImp_total = VivaFE
     Me.FE1.FEDetalleFecha_cbte = FCte
     Me.FE1.FEDetalleNro_doc = VCUIT
     Me.FE1.FEDetalleTipo_doc = VTipoDoc

     cIdentificador = 1
     bResultado = Me.FE1.Registrar("2", TipoComprobante_FacturaA, cIdentificador)
     If bResultado Then
        Exit Sub
        'MsgBox ("CAE: " + Me.FE.FERespuestaDetalleCae + Chr(10) + "MOTIVO: " + Me.FE.FERespuestaDetalleMotivo + Chr(10) + "PROCESO: " + Me.FE.FERespuestaReproceso + Chr(10) + "Numero: " + Str(Me.FE.FERespuestaDetalleCbt_desde))
   
     Else
        MsgBox ("Motivo: " + Me.FE1.FERespuestaDetalleMotivo + Chr(10) + " Error " + Me.FE1.Permsg + "Detalle: " + Me.FE1.UltimoMensajeError)
     End If
  End If
End Sub

Private Sub Aceptar_Click()
Dim lPrimaryKey As Long, VNroAsiento As Long, VNroFactComis As Long
Dim VEjercicio As Long, VMes As Long
' On Error GoTo ERR_GrabaLP
If FormatNumber(Diferencia) = 0 Then
    Set rsEncabLP = db.OpenRecordset("EncabLP")
    rsEncabLP.Index = "PrimaryKey"
    Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
    Set rsCHEmitidos = db.OpenRecordset("ChEmitidos")
    Set rsAsientos = db.OpenRecordset("Asientos")
    Set rsDetLPCH_P = db.OpenRecordset("DetLPCHPropios")
    Set rsDetLPCHTer = db.OpenRecordset("DetLPCHTerc")
'graba encabezado liquido producto
    lPrimaryKey = GetPrimaryKey
    With rsEncabLP
        .AddNew
        .Fields("NroLP") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("CodFlet") = Text1(0)
        .Fields("TotalLP") = TPago
        .Fields("TNComis") = TNComis
        .Fields("IVAComis") = TIVAComis
        .Fields("TComis") = TComis
        .Fields("TAdel") = TAdel
        .Fields("TGasOil") = TGasOil
        .Fields("TFalt") = TFalt
        .Fields("TEfvo") = TEfvo
        .Fields("TCHP") = TCHPropios
        .Fields("TCHT") = TCHTerceros
        .Update
    End With
    Set rsEncabLP = Nothing
    'graba en cta cte del proveedor
    With rsCtaCteProv
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodProv") = Text1(0)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 4
        .Fields("Debe") = TPago
        .Fields("SaldoComp") = FormatNumber(Diferencia)
        .Update
    End With
    Set rsCtaCteProv = Nothing
    'actualiza saldo de facturas aplicadas
    i = 0
    For i = i + 1 To FactAplicadas.ListItems.Count
        Set Lista = FactAplicadas.ListItems.Item(i)
        Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where CodProv = " & Text1(0) & " and NroComp = " & Lista.Tag & "")
        rsCtaCteProv.Edit
        rsCtaCteProv.LockEdits = True
        rsCtaCteProv.Fields("SaldoComp") = 0
        rsCtaCteProv.Update
        rsCtaCteProv.LockEdits = False
        'graba aplicacion de liquido producto en facturas
        Set rsFactProv_Liq = db.OpenRecordset("Select * From FactProv_Liq Where CodProv = " & Text1(0) & " And NroFact = " & Lista.Tag & "")
        rsFactProv_Liq.Edit
        rsFactProv_Liq.LockEdits = True
        rsFactProv_Liq.Fields("NroLP") = lPrimaryKey
        rsFactProv_Liq.Update
        rsFactProv_Liq.LockEdits = False
    Next
    Set rsCtaCteProv = Nothing

    'graba factura por comision

    Call Genera_FE
    'graba detalle en temporales
    i = 0
    For i = i + 1 To FactAplicadas.ListItems.Count
        Set Lista = FactAplicadas.ListItems.Item(i)
        If i = 1 Then
            Vnros = Lista.Tag
        Else
            Vnros = Vnros & ", " & Lista.Tag
        End If
    Next
    
        rsDetFact.AddNew
        rsDetFact.Fields("NroFAct") = VNro
        rsDetFact.Fields("TipoComp") = 1
        TrsDetFact.AddNew
        TrsDetFact.Fields("nrofact") = VNro
        Vnros = "Comis. por Flete Fact: " & Vnros
        cant = Len(Vnros)
    
        If cant > 50 Then
            Vnros = Mid(Vnros, 1, 49)
            rsDetFact.Fields("Mercaderia") = Vnros
            TrsDetFact.Fields("Mercaderia") = Vnros
        Else
            rsDetFact.Fields("Mercaderia") = Vnros
            TrsDetFact.Fields("Mercaderia") = Vnros
        End If
        rsDetFact.Fields("STotal") = TNComis
        rsDetFact.Fields("Alicuota") = 21
         TrsDetFact.Fields("STotal") = TNComis
      rsDetFact.Update
      TrsDetFact.Update

    'graba en temporales
    If Not Text1(8) = "0.00" Then
        i = 0
        For i = i + 1 To ListCHP.ListItems.Count
            Set Lista = ListCHP.ListItems.Item(i)
            With rsCHEmitidos
            .AddNew
            .Fields("Fecha") = Lista.SubItems(3)
            .Fields("CtaCte") = Lista.Tag
            .Fields("CodComp") = 1
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
            .Fields("NroLP") = lPrimaryKey
            .Fields("CtaCte") = Lista.Tag
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
            .Fields("NroLP") = lPrimaryKey
            Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & Lista.SubItems(1) & "'")
            .Fields("CodBanco") = rsBcos!CodBco
            .Fields("Vto") = Lista.SubItems(2)
            .Fields("Importe") = Lista.SubItems(3)
            .Fields("NroCH") = Lista.Tag
            .Update
        End With
        'actualiza estado cheque tercero
        Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where CodBanco = " & rsBcos!CodBco & " and NroCH = " & Lista.Tag & "")
        rsChTer.Edit
        rsChTer.LockEdits = True
        rsChTer.Fields("Estado") = "Liquido Producto"
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
'graba asiento correspondiente factura comision
'Graba Asiento
With rsAsientos
    Items = 0
    VNroAsiento = GetNroAsiento
    Vfecha = Fecha
    VEjercicio = Mid(Vfecha, 7, 4)
    VMes = Mid(Vfecha, 4, 2)
    'calcula Valor correspondient al debe
    Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 2")
    .AddNew
    .Fields("NroAsiento") = VNroAsiento
    .Fields("CtaCont") = rsParametros!CtaCont
    Set rsParametros = Nothing
    .Fields("Debe") = TComis
    .Fields("CodComp") = 1
    .Fields("PtoVta") = 1
    .Fields("NroComp") = VNroFactComis
    .Fields("Codigo") = Text1(0)
    .Fields("Fecha") = Fecha
    .Fields("TipoAsiento") = 2
    .Fields("Ejercicio") = VEjercicio
    .Fields("Mes") = VMes
    .Update
    'calcula valores haber
    'Neto comision
    .AddNew
    Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 5")
    .Fields("NroAsiento") = VNroAsiento
    .Fields("CtaCont") = rsParametros!CtaCont
    Set rsParametros = Nothing
    .Fields("Haber") = TNComis
    .Fields("CodComp") = 1
    .Fields("PtoVta") = 1
    .Fields("NroComp") = VNroFactComis
    .Fields("Codigo") = Text1(0)
    .Fields("Fecha") = Fecha
    .Fields("TipoAsiento") = 2
    .Fields("Ejercicio") = VEjercicio
    .Fields("Mes") = VMes
    .Update
    'IVA COMISION
    .AddNew
    Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 4")
    .Fields("NroAsiento") = VNroAsiento
    .Fields("CtaCont") = rsParametros!CtaCont
    Set rsParametros = Nothing
    .Fields("Haber") = TIVAComis
    .Fields("CodComp") = 1
    .Fields("PtoVta") = 1
    .Fields("NroComp") = VNroFactComis
    .Fields("Codigo") = Text1(0)
    .Fields("Fecha") = Fecha
    .Fields("TipoAsiento") = 2
    .Fields("Ejercicio") = VEjercicio
    .Fields("Mes") = VMes
    .Update
    'GRABA ASIENTO LIQUIDO PRODUCTO
    '////DEBE////
    VNroAsiento = GetNroAsiento
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(0) & "")
    .AddNew
    .Fields("CtaCont") = rsFleteros!CtaContable
    .Fields("NroAsiento") = VNroAsiento
    .Fields("Debe") = TPago
    .Fields("CodComp") = 4
    .Fields("PtoVta") = 1
    .Fields("NroComp") = lPrimaryKey
    .Fields("Codigo") = Text1(0)
    .Fields("Fecha") = Fecha
    .Fields("TipoAsiento") = 4
    .Fields("Ejercicio") = VEjercicio
    .Fields("Mes") = VMes
    .Update
    '////HABER//// COMISION
    Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 2")
    .AddNew
    .Fields("NroAsiento") = VNroAsiento
    .Fields("CtaCont") = rsParametros!CtaCont
    Set rsParametros = Nothing
    .Fields("Haber") = TComis
    .Fields("CodComp") = 4
    .Fields("PtoVta") = 1
    .Fields("NroComp") = lPrimaryKey
    .Fields("Codigo") = Text1(0)
    .Fields("Fecha") = Fecha
    .Fields("TipoAsiento") = 4
    .Fields("Ejercicio") = VEjercicio
    .Fields("Mes") = VMes
    .Update
    '///HABER///  EFECTIVO
    If Not Text1(7) = "0.00" Then
        Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 6")
        .AddNew
        .Fields("NroAsiento") = VNroAsiento
        .Fields("CtaCont") = rsParametros!CtaCont
        Set rsParametros = Nothing
        .Fields("Haber") = Text1(7)
        .Fields("CodComp") = 4
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("Codigo") = Text1(0)
        .Fields("Fecha") = Fecha
        .Fields("TipoAsiento") = 4
        .Fields("Ejercicio") = VEjercicio
        .Fields("Mes") = VMes
        .Update
    End If
    '///HABER/// ADELANTOS
    TGAdelantos = TAdel + TGasOil + TFalt
    If Not TGAdelantos = 0 Then
        Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 7")
        .AddNew
        .Fields("NroAsiento") = VNroAsiento
        .Fields("CtaCont") = rsParametros!CtaCont
        Set rsParametros = Nothing
        .Fields("Haber") = TGAdelantos
        .Fields("CodComp") = 4
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("Codigo") = Text1(0)
        .Fields("Fecha") = Fecha
        .Fields("TipoAsiento") = 4
        .Fields("Ejercicio") = VEjercicio
        .Fields("Mes") = VMes
        .Update
    End If
    If Not Text1(8) = "0.00" Then
        Dim TCta As Double, Vcta As String, VCtaCont As String
        Set rsDetLPCH_P = db.OpenRecordset("Select * from DetLPCHPropios Where NroLP = " & lPrimaryKey & " Order By CtaCte")
        Vcta = rsDetLPCH_P!CtaCte
        Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & rsDetLPCH_P!CtaCte & "'")
        VCtaCont = rsCtaBcoPropias!CtaContable
        Do While Not rsDetLPCH_P.EOF
            If rsDetLPCH_P!CtaCte = Vcta Then
                TCta = TCta + rsDetLPCH_P!Importe
                rsDetLPCH_P.MoveNext
            Else
                .AddNew
                .Fields("NroAsiento") = VNroAsiento
                .Fields("CtaCont") = VCtaCont
                .Fields("Haber") = TCta
                .Fields("CodComp") = 4
                .Fields("PtoVta") = 1
                .Fields("NroComp") = lPrimaryKey
                .Fields("Codigo") = Text1(0)
                .Fields("Fecha") = Fecha
                .Fields("TipoAsiento") = 4
                .Fields("Ejercicio") = VEjercicio
                .Fields("Mes") = VMes
                .Update
                Vcta = rsDetLPCH_P!CtaCte
                TCta = 0
            End If
        Loop
        If Not TCta = 0 Then
            .AddNew
            .Fields("NroAsiento") = VNroAsiento
            .Fields("CtaCont") = VCtaCont
            .Fields("Haber") = TCta
            .Fields("CodComp") = 4
            .Fields("PtoVta") = 1
            .Fields("NroComp") = lPrimaryKey
            .Fields("Codigo") = Text1(0)
            .Fields("Fecha") = Fecha
            .Fields("TipoAsiento") = 4
            .Fields("Ejercicio") = VEjercicio
            .Fields("Mes") = VMes
            .Update
            TCta = 0
        End If
        Set rsCtaBcoPropias = Nothing
        Set rsDetLPCH_P = Nothing
    End If
    '///HABER/// CHEQUES EN CARTERA
    If Not Text1(9) = "0.00" Then
        Set rsParametros = db.OpenRecordset("Select * from Parametros Where Codigo = 8")
        .AddNew
        .Fields("NroAsiento") = VNroAsiento
        .Fields("CtaCont") = rsParametros!CtaCont
        Set rsParametros = Nothing
        .Fields("Haber") = Text1(9)
        .Fields("CodComp") = 4
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("Codigo") = Text1(0)
        .Fields("Fecha") = Fecha
        .Fields("TipoAsiento") = 4
        .Fields("Ejercicio") = VEjercicio
        .Fields("Mes") = VMes
        .Update
    End If
End With
Set rsEncabLP = Nothing
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

With Msg_LP
    .Show
    .Height = 3105
    .Width = 6120
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
    .NroFact = VNro
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
If CuentaCH_P < 7 Then
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
Else
    MsgBox "No puede cargar más de 4 cheques"
End If
End Sub

Private Sub Cancelar_Click()
Form_Initialize
Form_Load
End Sub

Private Sub CargarDesc_Click()
On Error Resume Next
Text1(7).Locked = False
i = Len(Text1(7))
Text1(7).SelStart = 0
Text1(7).SelLength = i
Text1(7).SetFocus
End Sub

Private Sub ChCartera_DblClick()
Dim x As ListItem
If CuentaCH_T < 7 Then
    Set x = ChCartera.ListItems.Item(ChCartera.SelectedItem.Index)
    Set Lista = CHTerAplic.ListItems.Add(, , x.Tag)
    Lista.Tag = x.Tag
    Lista.SubItems(1) = x.SubItems(1)
    Lista.SubItems(2) = x.SubItems(2)
    Lista.SubItems(3) = x.SubItems(3)
    TCHTerceros = TCHTerceros + x.SubItems(3)
    TPago = TPago + x.SubItems(3)
    Diferencia = TAPagar - TPago
    Text1(9) = FormatNumber(TCHTerceros)
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    Label3 = FormatNumber(TCHTerceros)
    CuentaCH_T = CuentaCH_T + 1
    ChCartera.ListItems.Remove (ChCartera.SelectedItem.Index)
Else
    MsgBox "No se puede Cargar más de 4 cheques", vbInformation
End If

End Sub

Private Sub CHPAdel_DblClick()
Dim lista1 As ListItem
If CuentaCH_P < 7 Then
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
Set rsFactProv_Liq = db.OpenRecordset("Select * from FactProv_Liq where CodProv = " & Text1(0) & " and NroFact = " & Lista.Tag & " and PtoVta = " & Lista.SubItems(5) & "")
Do While Not rsFactProv_Liq.EOF
    Set rsEncabLiq = db.OpenRecordset("Select * from EncabLiquidacion Where NroLiq = " & rsFactProv_Liq!NroLiq & "")
    TNComis = TNComis + rsEncabLiq!TNetoComis
    TIVAComis = TIVAComis + rsEncabLiq!TIVAComis
    TComis = TComis + rsEncabLiq!TComis
    'busca detalle de la liquidacion
    Set rsLiqDetDesc = db.OpenRecordset("Select * from LiqDetDescuentos Where NroLiq = " & rsFactProv_Liq!NroLiq & "")
    Do While Not rsLiqDetDesc.EOF
        TAdel = TAdel + rsLiqDetDesc!Efvo
        TGasOil = TGasOil + rsLiqDetDesc.Fields("Gas-Oil")
        TFalt = TFalt + rsLiqDetDesc!Faltante
        rsLiqDetDesc.MoveNext
    Loop
    rsFactProv_Liq.MoveNext
Loop
Set rsFactProv_Liq = Nothing
Set rsEncabLiq = Nothing
Set rsLiqDetDesc = Nothing
Text1(4) = FormatNumber(TComis)
Text1(5) = FormatNumber(TIVAComis)
Text1(6) = FormatNumber(TNComis)
Text1(10) = FormatNumber(TAdel)
Text1(11) = FormatNumber(TGasOil)
Text1(12) = FormatNumber(TFalt)
TAPagar = TGFactAplic
TPago = TComis + TAdel + TGasOil + TFalt
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
End Sub
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabLP
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroLP") + 1
            
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
Frame1.Visible = True: Frame2.Visible = True
CHPropios.Visible = False: CHTerceros.Visible = False
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
        Text1(i - 1).Locked = True
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
Frame1.Visible = False: Frame2.Visible = False
CHPropios.Visible = True: CHTerceros.Visible = False
End Sub

Private Sub KewlButtons2_Click()
Frame1.Visible = False: Frame2.Visible = False
CHPropios.Visible = False: CHTerceros.Visible = True
End Sub

Private Sub KewlButtons3_Click()
Frame1.Visible = True: Frame2.Visible = True
CHPropios.Visible = False: CHTerceros.Visible = False
End Sub

Private Sub LCHTAdel_DblClick()
Dim x As ListItem
If CuentaCH_T < 7 Then
    Set x = LCHTAdel.ListItems.Item(LCHTAdel.SelectedItem.Index)
    Set Lista = CHTerAplic.ListItems.Add(, , x.Tag)
    Lista.Tag = x.Tag
    Lista.SubItems(1) = x.SubItems(1)
    Lista.SubItems(2) = x.SubItems(2)
    Lista.SubItems(3) = x.SubItems(3)
    Lista.SubItems(4) = "SI"
    TCHTerceros = TCHTerceros + x.SubItems(3)
    TPago = TPago + x.SubItems(3)
    Diferencia = TAPagar - TPago
    Text1(9) = FormatNumber(TCHTerceros)
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    Label3 = FormatNumber(TCHTerceros)
    CuentaCH_T = CuentaCH_T + 1
    LCHTAdel.ListItems.Remove (LCHTAdel.SelectedItem.Index)
Else
    MsgBox "No se puede Cargar más de 4 cheques", vbInformation
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
        Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabFactProv WHERE CodProv = " & Text1(0) & " AND NroFact = " & rsCtaCteProv!NroComp & " AND PtoVta = " & rsCtaCteProv!PtoVta & "")
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
            rsEncabFactProv.MoveNext
        Loop
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
End If
Set rsFleteros = Nothing
Set rsCtaCteProv = Nothing
Set rsEncabFactProv = Nothing
Case 7:
    TPago = TPago - ZEfvo + Text1(7)
    TEfvo = TEfvo - ZEfvo + Text1(7)
    Diferencia = TAPagar - TPago
    Text1(13) = FormatNumber(TPago)
    Text1(14) = FormatNumber(Diferencia)
    Text1(7).Locked = True
    ZEfvo = Text1(7)

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
   Set rsCHEmitidos = db.OpenRecordset("Select * From CHEmitidos Where NroComp = " & Text2(1) & "")
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
