VERSION 5.00
Begin VB.Form RImprirFactura 
   Caption         =   "Re Imprimir Factura"
   ClientHeight    =   1470
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   3705
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   1470
   ScaleWidth      =   3705
   Begin VB.ComboBox Comp 
      Height          =   315
      Left            =   1680
      TabIndex        =   4
      Top             =   120
      Width           =   1815
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Re Imprimir"
      Height          =   375
      Left            =   240
      TabIndex        =   2
      Top             =   960
      Width           =   2775
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      Left            =   1680
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   480
      Width           =   1335
   End
   Begin VB.Label Label3 
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
      ForeColor       =   &H00FF0000&
      Height          =   255
      Index           =   1
      Left            =   120
      TabIndex        =   3
      Top             =   120
      Width           =   1455
   End
   Begin VB.Label Label3 
      Caption         =   "Nro Factura"
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
      Height          =   255
      Index           =   0
      Left            =   120
      TabIndex        =   1
      Top             =   480
      Width           =   1455
   End
End
Attribute VB_Name = "RImprirFactura"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Command1_Click()
Call Imprime_Fact(Text1, Comp.ListIndex + 1)
End Sub

Private Sub Form_Load()
Text1 = ""
Comp.AddItem "Factura"
Comp.AddItem "Nota de Credito"
Comp.AddItem "Nota de Debito"
Comp.ListIndex = 0
End Sub
