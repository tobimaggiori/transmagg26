VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MsComCtl.ocx"
Begin VB.Form AnulaFact 
   BackColor       =   &H80000007&
   Caption         =   "Anular o Borrar Factura"
   ClientHeight    =   8610
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   12255
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8610
   ScaleWidth      =   12255
   Begin VB.Frame LProducto 
      BackColor       =   &H80000012&
      Caption         =   "LIQUIDO PRODUCTO"
      ForeColor       =   &H0080C0FF&
      Height          =   6855
      Left            =   120
      TabIndex        =   79
      Top             =   1200
      Visible         =   0   'False
      Width           =   7455
      Begin VB.Frame Frame7 
         BackColor       =   &H80000012&
         Caption         =   "Encabezado"
         ForeColor       =   &H000000C0&
         Height          =   975
         Left            =   240
         TabIndex        =   104
         Top             =   240
         Width           =   6975
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   17
            Left            =   5040
            TabIndex        =   109
            Text            =   "Text1"
            Top             =   360
            Width           =   1770
         End
         Begin VB.TextBox Text1 
            Height          =   285
            Index           =   16
            Left            =   1680
            TabIndex        =   107
            Text            =   "Text1"
            Top             =   360
            Width           =   2490
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   15
            Left            =   840
            TabIndex        =   106
            Text            =   "Text1"
            Top             =   360
            Width           =   810
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
            Index           =   1
            Left            =   4320
            TabIndex        =   108
            Top             =   360
            Width           =   855
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
            Left            =   120
            TabIndex        =   105
            Top             =   360
            Width           =   855
         End
      End
      Begin VB.Frame Frame6 
         BackColor       =   &H80000007&
         Caption         =   "Detalle Pago"
         ForeColor       =   &H000040C0&
         Height          =   5175
         Left            =   240
         TabIndex        =   81
         Top             =   1320
         Width           =   5415
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   7
            Left            =   3960
            TabIndex        =   95
            Text            =   "Text1"
            Top             =   2400
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   8
            Left            =   3960
            TabIndex        =   94
            Text            =   "Text1"
            Top             =   2760
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   9
            Left            =   3960
            TabIndex        =   93
            Text            =   "Text1"
            Top             =   3120
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   10
            Left            =   3960
            TabIndex        =   92
            Text            =   "Text1"
            Top             =   3480
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   11
            Left            =   3960
            TabIndex        =   91
            Text            =   "Text1"
            Top             =   3840
            Width           =   1050
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   12
            Left            =   3960
            TabIndex        =   90
            Text            =   "Text1"
            Top             =   4200
            Width           =   1050
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
            TabIndex        =   89
            Text            =   "Text1"
            Top             =   4680
            Width           =   1050
         End
         Begin VB.Frame Frame5 
            BackColor       =   &H80000008&
            Caption         =   "Totales Factura Comisión"
            ForeColor       =   &H000040C0&
            Height          =   1815
            Left            =   120
            TabIndex        =   82
            Top             =   240
            Width           =   5175
            Begin VB.TextBox Text1 
               Alignment       =   1  'Right Justify
               Height          =   285
               Index           =   6
               Left            =   3840
               TabIndex        =   85
               Text            =   "Text1"
               Top             =   360
               Width           =   1050
            End
            Begin VB.TextBox Text1 
               Alignment       =   1  'Right Justify
               Height          =   285
               Index           =   5
               Left            =   3840
               TabIndex        =   84
               Text            =   "Text1"
               Top             =   720
               Width           =   1050
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
               Index           =   4
               Left            =   3840
               TabIndex        =   83
               Text            =   "Text1"
               Top             =   1200
               Width           =   1050
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
               TabIndex        =   88
               Top             =   360
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
               TabIndex        =   87
               Top             =   720
               Width           =   3135
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
               TabIndex        =   86
               Top             =   1200
               Width           =   3135
            End
            Begin VB.Line Line4 
               BorderColor     =   &H000040C0&
               X1              =   3720
               X2              =   5040
               Y1              =   1080
               Y2              =   1080
            End
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
            TabIndex        =   102
            Top             =   2400
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
            TabIndex        =   101
            Top             =   2760
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
            TabIndex        =   100
            Top             =   3120
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
            TabIndex        =   99
            Top             =   3480
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
            TabIndex        =   98
            Top             =   3840
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
            TabIndex        =   97
            Top             =   4200
            Width           =   3135
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
            TabIndex        =   96
            Top             =   4680
            Width           =   3135
         End
         Begin VB.Line Line5 
            BorderColor     =   &H000040C0&
            X1              =   3840
            X2              =   5160
            Y1              =   4560
            Y2              =   4560
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
         ForeColor       =   &H000000FF&
         Height          =   285
         Index           =   14
         Left            =   4680
         TabIndex        =   80
         Text            =   "Text1"
         Top             =   7560
         Width           =   1050
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
         Left            =   960
         TabIndex        =   103
         Top             =   7560
         Width           =   3135
      End
   End
   Begin VB.Frame NC_Cta 
      BackColor       =   &H80000007&
      Caption         =   "Nota de Credito por Cta y Orden"
      ForeColor       =   &H0080C0FF&
      Height          =   1695
      Left            =   120
      TabIndex        =   67
      Top             =   1200
      Visible         =   0   'False
      Width           =   9615
      Begin VB.TextBox Text8 
         Height          =   285
         Index           =   5
         Left            =   7080
         TabIndex        =   78
         Text            =   "Text8"
         Top             =   960
         Width           =   855
      End
      Begin VB.TextBox Text8 
         Height          =   285
         Index           =   4
         Left            =   3120
         TabIndex        =   77
         Text            =   "Text8"
         Top             =   960
         Width           =   855
      End
      Begin VB.TextBox Text8 
         Height          =   285
         Index           =   3
         Left            =   960
         TabIndex        =   76
         Text            =   "Text8"
         Top             =   960
         Width           =   855
      End
      Begin VB.TextBox Text8 
         Height          =   285
         Index           =   2
         Left            =   7080
         TabIndex        =   70
         Text            =   "Text8"
         Top             =   480
         Width           =   855
      End
      Begin VB.TextBox Text8 
         Height          =   285
         Index           =   1
         Left            =   1920
         TabIndex        =   69
         Text            =   "Text8"
         Top             =   480
         Width           =   3735
      End
      Begin VB.TextBox Text8 
         Height          =   285
         Index           =   0
         Left            =   960
         TabIndex        =   68
         Text            =   "Text8"
         Top             =   480
         Width           =   855
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total:"
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
         Left            =   5880
         TabIndex        =   75
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "IVA:"
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
         Left            =   2640
         TabIndex        =   74
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Neto:"
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
         Left            =   120
         TabIndex        =   73
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label1 
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
         Index           =   14
         Left            =   5880
         TabIndex        =   72
         Top             =   480
         Width           =   1455
      End
      Begin VB.Label Label1 
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
         Index           =   13
         Left            =   120
         TabIndex        =   71
         Top             =   480
         Width           =   1455
      End
   End
   Begin VB.TextBox Text7 
      Height          =   285
      Left            =   6000
      TabIndex        =   65
      Text            =   "Text7"
      Top             =   240
      Visible         =   0   'False
      Width           =   1455
   End
   Begin VB.CommandButton BuscComp 
      Caption         =   "Buscar"
      Height          =   495
      Left            =   7920
      TabIndex        =   6
      Top             =   360
      Width           =   1695
   End
   Begin VB.CommandButton Anular 
      Caption         =   "Anular"
      Height          =   495
      Left            =   9720
      TabIndex        =   2
      Top             =   360
      Width           =   1695
   End
   Begin VB.ComboBox Comp 
      Height          =   315
      Left            =   1920
      TabIndex        =   1
      Top             =   240
      Width           =   1815
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1920
      TabIndex        =   0
      Top             =   720
      Width           =   975
   End
   Begin VB.Frame FactCta 
      BackColor       =   &H80000007&
      Caption         =   "Factura Cta y Orden"
      ForeColor       =   &H0080C0FF&
      Height          =   4335
      Left            =   120
      TabIndex        =   19
      Top             =   1200
      Visible         =   0   'False
      Width           =   11895
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   5
         Left            =   7440
         TabIndex        =   28
         Text            =   "Text4"
         Top             =   3960
         Width           =   1575
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   4
         Left            =   7440
         TabIndex        =   27
         Text            =   "Text4"
         Top             =   3600
         Width           =   1575
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   3
         Left            =   7440
         TabIndex        =   26
         Text            =   "Text4"
         Top             =   3240
         Width           =   1575
      End
      Begin MSComctlLib.ListView DetFactCta 
         Height          =   1935
         Left            =   240
         TabIndex        =   25
         Top             =   1080
         Width           =   11415
         _ExtentX        =   20135
         _ExtentY        =   3413
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
         NumItems        =   9
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Remito"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Mercaderia"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Origen"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Destino"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Kilos"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "Fletero"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   2
         Left            =   7080
         TabIndex        =   23
         Text            =   "Text4"
         Top             =   480
         Width           =   1575
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   1
         Left            =   1920
         TabIndex        =   22
         Text            =   "Text4"
         Top             =   480
         Width           =   3735
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   0
         Left            =   1080
         TabIndex        =   21
         Text            =   "Text4"
         Top             =   480
         Width           =   735
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Sub Total"
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
         Left            =   5400
         TabIndex        =   31
         Top             =   3240
         Width           =   1935
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "IVA"
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
         Left            =   5400
         TabIndex        =   30
         Top             =   3600
         Width           =   1935
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total"
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
         Left            =   5400
         TabIndex        =   29
         Top             =   3960
         Width           =   1935
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Fecha"
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
         Left            =   6360
         TabIndex        =   24
         Top             =   480
         Width           =   975
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Codigo:"
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
         Left            =   240
         TabIndex        =   20
         Top             =   480
         Width           =   975
      End
   End
   Begin VB.Frame Liquidacion 
      BackColor       =   &H80000007&
      Caption         =   "Liquidacion"
      ForeColor       =   &H000040C0&
      Height          =   5655
      Left            =   1440
      TabIndex        =   32
      Top             =   1200
      Visible         =   0   'False
      Width           =   8175
      Begin VB.Frame Frame4 
         BackColor       =   &H00000000&
         Caption         =   "Resumen"
         ForeColor       =   &H000040C0&
         Height          =   2655
         Left            =   240
         TabIndex        =   33
         Top             =   2880
         Width           =   7695
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   8
            Left            =   3600
            TabIndex        =   37
            Text            =   "Text1"
            Top             =   360
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   9
            Left            =   3600
            TabIndex        =   36
            Text            =   "Text1"
            Top             =   720
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   10
            Left            =   3600
            TabIndex        =   35
            Text            =   "Text1"
            Top             =   1080
            Width           =   1695
         End
         Begin VB.TextBox Text5 
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
            ForeColor       =   &H00FF0000&
            Height          =   285
            Index           =   11
            Left            =   3600
            TabIndex        =   34
            Text            =   "Text1"
            Top             =   1920
            Width           =   1695
         End
         Begin VB.Label Label5 
            BackColor       =   &H00000000&
            Caption         =   "Total Viajes Realizados"
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
            Left            =   1080
            TabIndex        =   41
            Top             =   360
            Width           =   2775
         End
         Begin VB.Label Label6 
            BackColor       =   &H00000000&
            Caption         =   "Total Comisiones "
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
            Left            =   1080
            TabIndex        =   40
            Top             =   720
            Width           =   1455
         End
         Begin VB.Label Label12 
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
            Index           =   0
            Left            =   1080
            TabIndex        =   39
            Top             =   1080
            Width           =   2055
         End
         Begin VB.Label Label13 
            BackColor       =   &H00000000&
            Caption         =   "Total a Pagar"
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
            Left            =   1080
            TabIndex        =   38
            Top             =   1920
            Width           =   2055
         End
         Begin VB.Line Line3 
            BorderColor     =   &H000040C0&
            BorderWidth     =   2
            X1              =   3480
            X2              =   5415
            Y1              =   1800
            Y2              =   1815
         End
      End
      Begin VB.TextBox Text6 
         Height          =   285
         Index           =   2
         Left            =   6360
         TabIndex        =   62
         Text            =   "Text6"
         Top             =   360
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Height          =   285
         Index           =   1
         Left            =   1920
         TabIndex        =   61
         Text            =   "Text6"
         Top             =   360
         Width           =   3015
      End
      Begin VB.TextBox Text6 
         Height          =   285
         Index           =   0
         Left            =   1200
         TabIndex        =   60
         Text            =   "Text6"
         Top             =   360
         Width           =   615
      End
      Begin VB.Frame Frame2 
         BackColor       =   &H00000000&
         Caption         =   "Viajes Realizados"
         ForeColor       =   &H000040C0&
         Height          =   2055
         Left            =   240
         TabIndex        =   51
         Top             =   720
         Width           =   3375
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   0
            Left            =   1440
            TabIndex        =   55
            Text            =   "Text1"
            Top             =   360
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   1
            Left            =   1440
            TabIndex        =   54
            Text            =   "Text1"
            Top             =   720
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   3
            Left            =   1440
            TabIndex        =   53
            Text            =   "Text1"
            Top             =   1680
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   2
            Left            =   1440
            TabIndex        =   52
            Text            =   "Text1"
            Top             =   1080
            Width           =   1695
         End
         Begin VB.Label Label4 
            BackColor       =   &H00000000&
            Caption         =   "Neto Viajes"
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
            TabIndex        =   59
            Top             =   360
            Width           =   1455
         End
         Begin VB.Label Label7 
            BackColor       =   &H00000000&
            Caption         =   "IVA "
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
            Left            =   240
            TabIndex        =   58
            Top             =   720
            Width           =   1455
         End
         Begin VB.Label Label8 
            BackColor       =   &H00000000&
            Caption         =   "Total Viajes"
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
            Left            =   240
            TabIndex        =   57
            Top             =   1680
            Width           =   1455
         End
         Begin VB.Line Line1 
            BorderColor     =   &H000040C0&
            BorderWidth     =   2
            X1              =   1320
            X2              =   3255
            Y1              =   1560
            Y2              =   1575
         End
         Begin VB.Label Label12 
            BackColor       =   &H00000000&
            Caption         =   "Retencion IIBB"
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
            Left            =   120
            TabIndex        =   56
            Top             =   1080
            Width           =   1335
         End
      End
      Begin VB.Frame Frame3 
         BackColor       =   &H00000000&
         Caption         =   "Comisiones"
         ForeColor       =   &H000040C0&
         Height          =   2055
         Left            =   3840
         TabIndex        =   42
         Top             =   720
         Width           =   4095
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   4
            Left            =   2280
            TabIndex        =   46
            Text            =   "Text1"
            Top             =   360
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   5
            Left            =   2280
            TabIndex        =   45
            Text            =   "Text1"
            Top             =   720
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   6
            Left            =   2280
            TabIndex        =   44
            Text            =   "Text1"
            Top             =   1080
            Width           =   1695
         End
         Begin VB.TextBox Text5 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   7
            Left            =   2280
            TabIndex        =   43
            Text            =   "Text1"
            Top             =   1680
            Width           =   1695
         End
         Begin VB.Label Label2 
            BackColor       =   &H00000000&
            Caption         =   "Porcentaje Comision"
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
            Left            =   240
            TabIndex        =   50
            Top             =   360
            Width           =   1815
         End
         Begin VB.Label Label9 
            BackColor       =   &H00000000&
            Caption         =   "Comision Neta"
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
            Left            =   240
            TabIndex        =   49
            Top             =   720
            Width           =   1815
         End
         Begin VB.Label Label10 
            BackColor       =   &H00000000&
            Caption         =   "IVA"
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
            Left            =   240
            TabIndex        =   48
            Top             =   1080
            Width           =   1815
         End
         Begin VB.Label Label11 
            BackColor       =   &H00000000&
            Caption         =   "Total Comision"
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
            Left            =   240
            TabIndex        =   47
            Top             =   1680
            Width           =   1815
         End
         Begin VB.Line Line2 
            BorderColor     =   &H000040C0&
            BorderWidth     =   2
            X1              =   2160
            X2              =   4095
            Y1              =   1440
            Y2              =   1455
         End
      End
      Begin VB.Label Label4 
         BackColor       =   &H00000000&
         Caption         =   "Fecha"
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
         Left            =   5520
         TabIndex        =   64
         Top             =   360
         Width           =   1455
      End
      Begin VB.Label Label4 
         BackColor       =   &H00000000&
         Caption         =   "Fletero"
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
         Left            =   240
         TabIndex        =   63
         Top             =   360
         Width           =   1455
      End
   End
   Begin VB.Frame FactA 
      BackColor       =   &H80000007&
      Caption         =   "Factura A"
      ForeColor       =   &H0080C0FF&
      Height          =   4335
      Left            =   120
      TabIndex        =   5
      Top             =   1200
      Visible         =   0   'False
      Width           =   12015
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   2
         Left            =   9960
         TabIndex        =   15
         Text            =   "Text3"
         Top             =   3840
         Width           =   1455
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   1
         Left            =   9960
         TabIndex        =   14
         Text            =   "Text3"
         Top             =   3480
         Width           =   1455
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   0
         Left            =   9960
         TabIndex        =   13
         Text            =   "Text3"
         Top             =   3120
         Width           =   1455
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   2
         Left            =   7200
         TabIndex        =   12
         Text            =   "Text2"
         Top             =   480
         Width           =   1575
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   1
         Left            =   2040
         TabIndex        =   11
         Text            =   "Text2"
         Top             =   480
         Width           =   3615
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   0
         Left            =   1200
         TabIndex        =   10
         Text            =   "Text2"
         Top             =   480
         Width           =   735
      End
      Begin MSComctlLib.ListView DetFactA 
         Height          =   1935
         Left            =   360
         TabIndex        =   9
         Top             =   960
         Width           =   11500
         _ExtentX        =   20294
         _ExtentY        =   3413
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
         NumItems        =   9
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha Viaje"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Remito"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Mercaderia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Procedencia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Destino"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Kilos"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "STotal"
            Object.Width           =   17639
         EndProperty
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total"
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
         Left            =   7920
         TabIndex        =   18
         Top             =   3840
         Width           =   1935
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "IVA"
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
         Left            =   7920
         TabIndex        =   17
         Top             =   3480
         Width           =   1935
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Sub Total"
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
         Left            =   7920
         TabIndex        =   16
         Top             =   3120
         Width           =   1935
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Fecha"
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
         Left            =   6480
         TabIndex        =   8
         Top             =   480
         Width           =   975
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Codigo:"
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
         TabIndex        =   7
         Top             =   480
         Width           =   975
      End
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha Comprobante a Anular"
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
      Height          =   375
      Index           =   12
      Left            =   3960
      TabIndex        =   66
      Top             =   240
      Width           =   1935
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Número"
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
      Left            =   120
      TabIndex        =   4
      Top             =   720
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Comprobante"
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
      TabIndex        =   3
      Top             =   240
      Width           =   1455
   End
End
Attribute VB_Name = "AnulaFact"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Anular_Click()
If Comp.ListIndex = 0 Then 'Factura
    Dim VTipoFact As Integer
    Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & Text1(0) & "")
    If Not rsEncabFact.EOF And Not rsEncabFact.BOF Then
        VTipoFact = rsEncabFact!TipoFact
        rsEncabFact.Edit
        rsEncabFact!Codigo = 99999
        rsEncabFact.Update
        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & Text1(0) & "")
        If VTipoFact = 1 Then ' factura de viajes
            Do While Not rsDetFact.EOF
                Set rsViajesFact = db.OpenRecordset("Select * From ViajesFactura Where NroRemito = '" & rsDetFact!nroRem & "'")
                rsViajesFact.Edit
                rsViajesFact.Fields("Facturado") = "NO"
                rsViajesFact.Update
                Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroRemito = '" & rsDetFact!nroRem & "'")
                rsLiqDetViajes.Edit
                rsLiqDetViajes.Fields("Facturado") = "NO"
                rsLiqDetViajes.Update
                rsDetFact.MoveNext
            Loop
            rsDetFact.MoveFirst
            Do While Not rsDetFact.EOF
                rsDetFact.Delete
                rsDetFact.MoveNext
            Loop
            'borra en cta cte
            Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where NroComp = " & Text1(0) & " And TipoComp = 1")
            rsCtaCteEmp.Delete
        Else
            Do While Not rsDetFact.EOF
                rsDetFact.Delete
                rsDetFact.MoveNext
            Loop
        End If
        Set rsDetFact = Nothing
        Set rsLiqDetViajes = Nothing
        Set rsCtaCteEmp = Nothing
        
    Else
        rsEncabFact.AddNew
        rsEncabFact!Fecha = Text7
        rsEncabFact.Fields("Codigo") = 99999
        rsEncabFact.Fields("NroFact") = Text1(0)
        rsEncabFact.Fields("TipoFact") = 1
        rsEncabFact.Update
    End If
    Set rsEncabFact = Nothing
    MsgBox "Factura Anulada"
    Call Form_Load
End If
If Comp.ListIndex = 2 Then 'NC A
    Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & Text1(0) & "")
    rsEncabFact.Edit
    rsEncabFact!Codigo = 99999
    rsEncabFact.Update
    Set rsEncabFact = Nothing
    Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & Text1(0) & "")
        Do While Not rsDetFact.EOF
            rsDetFact.Delete
            rsDetFact.MoveNext
        Loop
    Set rsDetFact = Nothing
    Set rsLiqDetViajes = Nothing
    'borra en cta cte
    Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where NroComp = " & Text1(0) & " And TipoComp = 3")
    rsCtaCteEmp.Delete
    Set rsCtaCteEmp = Nothing
End If
If Comp.ListIndex = 3 Then 'FC CTA Y ORDEN
    Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & Text1(0) & "")
    If Not rsEncabFactCta.EOF And Not rsEncabFactCta.BOF Then
        rsEncabFactCta.Edit
        rsEncabFactCta!Codigo = 99999
        rsEncabFactCta.Update
    Else
        rsEncabFactCta.AddNew
        rsEncabFactCta!Fecha = Text7
        rsEncabFactCta.Fields("Codigo") = 99999
        rsEncabFactCta.Fields("NroFact") = Text1(0)
        rsEncabFactCta.Fields("TipoFact") = 3
        rsEncabFactCta.Update
    End If
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & Text1(0) & "")
        Do While Not rsDetFactCta.EOF
            Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Where NroRemito = '" & rsDetFactCta!nroRem & "'")
            rsLiqDetViajes.Edit
            rsLiqDetViajes.Fields("Facturado") = "NO"
            rsLiqDetViajes.Update
            Set rsViajesFact = db.OpenRecordset("Select * From ViajesFactura Where NroRemito = '" & rsDetFactCta!nroRem & "'")
            rsViajesFact.Edit
            rsViajesFact.Fields("Facturado") = "NO"
            rsViajesFact.Update
            rsDetFactCta.MoveNext
        Loop
                    rsDetFactCta.MoveFirst
        If Not rsDetFactCta.EOF And Not rsDetFactCta.BOF Then

            Do While Not rsDetFactCta.EOF
            rsDetFactCta.Delete
            rsDetFactCta.MoveNext
            Loop
        End If
    Set rsDetFactCta = Nothing
    Set rsLiqDetViajes = Nothing
    'borra en cta cte
    Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where NroComp = " & Text1(0) & " And TipoComp = 13")
    If Not rsCtaCteEmp.EOF And Not rsCtaCteEmp.BOF Then
        rsCtaCteEmp.Delete
    End If
    Set rsCtaCteEmp = Nothing
    MsgBox "Factura Anulada"
    Call Form_Load
End If
If Comp.ListIndex = 4 Then 'NC CTA Y ORDEN
Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & Text1(0) & "")
    If Not rsEncabFactCta.EOF And Not rsEncabFactCta.BOF Then
        rsEncabFactCta.Edit
        rsEncabFactCta!Codigo = 99999
        rsEncabFactCta.Update
    Else
        rsEncabFactCta.AddNew
        rsEncabFactCta!Fecha = Text7
        rsEncabFactCta.Fields("Codigo") = 99999
        rsEncabFactCta.Fields("NroFact") = Text1(0)
        rsEncabFactCta.Fields("TipoFact") = 4
        rsEncabFactCta.Update
    End If
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & Text1(0) & "")
        If Not rsDetFactCta.EOF And Not rsDetFactCta.BOF Then
            rsDetFactCta.MoveFirst
            Do While Not rsDetFactCta.EOF
            rsDetFactCta.Delete
            rsDetFactCta.MoveNext
            Loop
        End If
    Set rsDetFactCta = Nothing
    Set rsLiqDetViajes = Nothing
    'borra en cta cte
    Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where NroComp = " & Text1(0) & " And TipoComp = 14")
    If Not rsCtaCteEmp.EOF And Not rsCtaCteEmp.BOF Then
        rsCtaCteEmp.Delete
    End If
    Set rsCtaCteEmp = Nothing
    MsgBox "Factura Anulada"
    Call Form_Load
End If
If Comp.ListIndex = 6 Then 'LIQUIDO PRODUCTO
    Set rsEncabLP = db.OpenRecordset("Select * From EncabLP Where NroLP = " & Text1(0) & "")
    Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteProv Where NroComp = " & Text1(0) & " And TipoComp = 4")
    Set rsCHEmitidos = db.OpenRecordset("Select * From ChEmitidos Where NroMov = '" & Text1(0) & "'")
    Set rsDetLPCH_P = db.OpenRecordset("Select * From DetLPCHPropios Where NroLP = " & Text1(0) & "")
    Set rsFactProv_Liq = db.OpenRecordset("Select * From FactProv_Liq Where NroLP = " & Text1(0) & "")
    Set rsDetLPCHTer = db.OpenRecordset("Select * From DetLPCHTerc Where NroLP = " & Text1(0) & "")
    'Borra encabezado liquido producto
    With rsEncabLP
        .Edit
        .LockEdits = True
        .Fields("Fecha") = Fecha
        .Fields("CodFlet") = 99999
        .Fields("TotalLP") = 0
        .Fields("TNComis") = 0
        .Fields("IVAComis") = 0
        .Fields("TComis") = 0
        .Fields("TAdel") = 0
        .Fields("TGasOil") = 0
        .Fields("TFalt") = 0
        .Fields("TEfvo") = 0
        .Fields("TCHP") = 0
        .Fields("TCHT") = 0
        .Update
        .LockEdits = False
    End With
    Set rsEncabLP = Nothing
    'Borra en cta cte del proveedor
    With rsCtaCteProv
        .Delete
    End With
    Set rsCtaCteProv = Nothing
    'actualiza saldo de facturas aplicadas
    Do While Not rsFactProv_Liq.EOF
        Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where CodProv = " & Text1(15) & " and NroComp = " & rsFactProv_Liq!NroFact & "")
        rsCtaCteProv.Edit
        rsCtaCteProv.LockEdits = True
        rsCtaCteProv.Fields("SaldoComp") = rsCtaCteProv.Fields("Haber")
        rsCtaCteProv.Update
        rsCtaCteProv.LockEdits = False
        'graba aplicacion de liquido producto en facturas
        rsFactProv_Liq.Edit
        rsFactProv_Liq.LockEdits = True
        rsFactProv_Liq.Fields("NroLP") = Null
        rsFactProv_Liq.Update
        rsFactProv_Liq.LockEdits = False
        rsFactProv_Liq.MoveNext
    Loop
    Set rsCtaCteProv = Nothing

    'Borra detalle de cheques propios
    Do While Not rsCHEmitidos.EOF
        With rsCHEmitidos
            .Delete
            .MoveNext
        End With
    Loop
    Do While Not rsDetLPCH_P.EOF
        With rsDetLPCH_P
            .Delete
            .MoveNext
        End With
    Loop
    Set rsDetLPCH_P = Nothing
    'borra cheques de terceros
    Do While Not rsDetLPCHTer.EOF
        'actualiza estado cheque tercero
        Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where CodBanco = " & rsDetLPCHTer!CodBanco & " and NroCH = " & rsDetLPCHTer!NroCH & "")
        rsChTer.Edit
        rsChTer.LockEdits = True
        rsChTer.Fields("Estado") = "En Cartera"
        rsChTer.Fields("Dado") = ""
        rsChTer.Update
        rsChTer.LockEdits = False
        With rsDetLPCHTer
            .Delete
            .MoveNext
        End With
    Loop
    MsgBox "Liquido PRODUCTO anulado correctamente", vbInformation
    LProducto.Visible = False
    Comp.ListIndex = 0
End If
End Sub

Private Sub Borrar_Click()
End Sub

Private Sub BuscComp_Click()
Text7.Visible = False
Label1(12).Visible = False
If Comp.ListIndex = 0 Then 'Factura A
    Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & Text1(0) & "")
    If Not rsEncabFact.EOF And Not rsEncabFact.BOF Then
        If Not rsEncabFact!Codigo = 99999 Then
            Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & Text1(0) & "")
            FactA.Visible = True
            FactCta.Visible = False
            Liquidacion.Visible = False
            NC_Cta.Visible = False
            Text2(0) = rsEncabFact!Codigo
            If rsEncabFact!TipoFact = 1 Then
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
                Text2(1) = rsEmpresas!DEscEmpresas
                Text2(2) = rsEncabFact!Fecha
                Do While Not rsDetFact.EOF
                    Set Lista = DetFactA.ListItems.Add(, , rsDetFact!FechaViaje)
                    Lista.Tag = rsDetFact!FechaViaje
                    Lista.SubItems(1) = rsDetFact!nroRem
                    Lista.SubItems(2) = rsDetFact!Chofer
                    Lista.SubItems(3) = rsDetFact!Mercaderia
                    Lista.SubItems(4) = rsDetFact!Procedencia
                    Lista.SubItems(5) = rsDetFact!Destino
                    Lista.SubItems(6) = rsDetFact!Kilos
                    Lista.SubItems(7) = rsDetFact!Tarifa
                    Lista.SubItems(8) = rsDetFact!STotal
                    rsDetFact.MoveNext
                Loop
                Text3(0) = rsEncabFact!TNeto
                Text3(1) = rsEncabFact!TIVA
                Text3(2) = rsEncabFact!TGRAL
            Else
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!Codigo & "")
                Text2(1) = rsFleteros!DescFlet
                Text2(2) = rsEncabFact!Fecha
                Do While Not rsDetFact.EOF
                    Set Lista = DetFactA.ListItems.Add(, , "")
                    Lista.Tag = ""
                    Lista.SubItems(3) = rsDetFact!Mercaderia
                    Lista.SubItems(8) = rsDetFact!STotal
                    rsDetFact.MoveNext
                Loop
                Text3(0) = rsEncabFact!TNeto
                Text3(1) = rsEncabFact!TIVA
                Text3(2) = rsEncabFact!TGRAL
            End If
        Else
            MsgBox "La Factura ya Fue Anulada"
        End If
    Else
        MsgBox "La Factura no fue grabada", vbInformation
        Text7.Visible = True
        Label1(12).Visible = True
        Text7 = ""
    End If
    Set rsEncabFact = Nothing
End If
If Comp.ListIndex = 3 Then 'FACTURA CTA Y ORDEN
    Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & Text1(0) & "")
    If Not rsEncabFactCta.EOF And Not rsEncabFactCta.BOF Then
        If Not rsEncabFactCta!Codigo = 99999 Then
            Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & Text1(0) & "")
            FactCta.Visible = True
            FactA.Visible = False
            Liquidacion.Visible = False
            NC_Cta.Visible = False
            Text4(0) = rsEncabFactCta!Codigo
            If rsEncabFactCta!TipoFact = 3 Then
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFactCta!Codigo & "")
                Text4(1) = rsEmpresas!DEscEmpresas
                Text4(2) = rsEncabFactCta!Fecha
                Do While Not rsDetFactCta.EOF
                    Set Lista = DetFactCta.ListItems.Add(, , rsDetFactCta!FechaViaje)
                    Lista.Tag = rsDetFactCta!FechaViaje
                    Lista.SubItems(1) = rsDetFactCta!nroRem
                    Lista.SubItems(2) = rsDetFactCta!Mercaderia
                    Lista.SubItems(3) = rsDetFactCta!Procedencia
                    Lista.SubItems(4) = rsDetFactCta!Destino
                    Lista.SubItems(5) = rsDetFactCta!Kilos
                    Lista.SubItems(6) = rsDetFactCta!Tarifa
                    Lista.SubItems(7) = rsDetFactCta!STotal
                    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsDetFactCta!CodFlet & "")
                    Lista.SubItems(8) = rsFleteros!DescFlet
                    Set rsFleteros = Nothing
                    rsDetFactCta.MoveNext
                Loop
                Text4(3) = rsEncabFactCta!TNeto
                Text4(4) = rsEncabFactCta!TIVA
                Text4(5) = rsEncabFactCta!TGRAL
            End If
        Else
            MsgBox "La Factura ya fue anulada"
            Set rsEncabFactCta = Nothing
        End If
    Else
        MsgBox "La Factura no fue grabada", vbInformation
        Text7.Visible = True
        Label1(12).Visible = True
        Text7 = ""
    End If
End If
If Comp.ListIndex = 4 Then 'NC CTA Y ORDEN
    Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & Text1(0) & "")
    If Not rsEncabFactCta.EOF And Not rsEncabFactCta.BOF Then
        If Not rsEncabFactCta!Codigo = 99999 Then
            FactCta.Visible = False
            FactA.Visible = False
            Liquidacion.Visible = False
            NC_Cta.Visible = True
            Text8(0) = rsEncabFactCta!Codigo
            If rsEncabFactCta!TipoFact = 4 Then
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFactCta!Codigo & "")
                Text8(1) = rsEmpresas!DEscEmpresas
                Text8(2) = rsEncabFactCta!Fecha
                Text8(3) = rsEncabFactCta!TNeto
                Text8(4) = rsEncabFactCta!TIVA
                Text8(5) = rsEncabFactCta!TGRAL
            End If
        Else
            MsgBox "La Nota de Credito ya fue anulada"
            Set rsEncabFactCta = Nothing
        End If
    Else
        MsgBox "La Factura no fue grabada", vbInformation
        Text7.Visible = True
        Label1(12).Visible = True
        Text7 = ""
    End If
End If
If Comp.ListIndex = 6 Then
    LProducto.Visible = True
    Set rsEncabLP = db.OpenRecordset("Select * From EncabLP Where NroLP = " & Text1(0) & "")
    With rsEncabLP
    Text1(17) = .Fields("Fecha")
    Text1(15) = .Fields("CodFlet")
    Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsEncabLP!CodFlet & "")
    Text1(16) = rsFleteros!DescFlet
    Text1(13) = .Fields("TotalLP")
    Text1(6) = .Fields("TNComis")
    Text1(5) = .Fields("IVAComis")
    Text1(4) = .Fields("TComis")
    Text1(10) = .Fields("TAdel")
    Text1(11) = .Fields("TGasOil")
    Text1(12) = .Fields("TFalt")
    Text1(7) = .Fields("TEfvo")
    Text1(8) = .Fields("TCHP")
    Text1(9) = .Fields("TCHT")
End With
Set rsEncabLP = Nothing
Set rsFleteros = Nothing
End If
If Comp.ListIndex = 7 Then 'LIQUIDACION
    Liquidacion.Visible = True
    FactA.Visible = False
    FactCta.Visible = False
    Set rsEncabLiq = db.OpenRecordset("Select * From EncabLiquidacion Where NroLiq = " & Text1(0) & "")
    If Not rsEncabLiq.EOF And Not rsEncabLiq.BOF Then
        Text6(0) = rsEncabLiq!CodFlet
        Text6(2) = rsEncabLiq!Fecha
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabLiq!CodFlet & "")
        Text6(1) = rsFleteros!DescFlet
        Text5(0) = rsEncabLiq!TNetoViajes
        Text5(1) = rsEncabLiq!TIVAViajes
        Text5(3) = rsEncabLiq!TViajes
        Text5(4) = rsFleteros!Comision
        Text5(5) = rsEncabLiq!TNetoComis
        Text5(6) = rsEncabLiq!TIVAComis
        Text5(7) = rsEncabLiq!TComis
        Text5(8) = rsEncabLiq!TViajes
        Text5(9) = rsEncabLiq!TComis
        Text5(10) = rsEncabLiq!TDescuentos
        Text5(11) = rsEncabLiq!TPagar
    Else
        MsgBox "La Liquidacion no Existe", vbInformation
    End If
End If
End Sub

Private Sub Form_Load()
Comp.Clear
Comp.AddItem ("Factura")
Comp.AddItem ("Nota de Debito")
Comp.AddItem ("Nota de Credito")
Comp.AddItem ("Factura por Cta y Orden")
Comp.AddItem ("NC por Cta y Orden")
Comp.AddItem ("Recibo por Cobranza")
Comp.AddItem ("Liquido producto")
Comp.AddItem ("Liquidación")
Comp.ListIndex = 0
Text7.Visible = False
Label1(12).Visible = False
FactA.Visible = False
FactCta.Visible = False
Liquidacion.Visible = False
End Sub

