VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ReeImpFact 
   BackColor       =   &H80000007&
   Caption         =   "Re-Impresión Facturas"
   ClientHeight    =   1905
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4635
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   1905
   ScaleWidth      =   4635
   Begin VB.TextBox NroFact 
      Height          =   285
      Left            =   1800
      TabIndex        =   1
      Top             =   360
      Width           =   1335
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   0
      Left            =   240
      TabIndex        =   2
      Top             =   960
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprimir"
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
      MICON           =   "ReeImpFact.frx":0000
      PICN            =   "ReeImpFact.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   1
      Left            =   2640
      TabIndex        =   3
      Top             =   960
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Visualizar"
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
      MICON           =   "ReeImpFact.frx":0A2E
      PICN            =   "ReeImpFact.frx":0A4A
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
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   360
      TabIndex        =   0
      Top             =   360
      Width           =   1215
   End
End
Attribute VB_Name = "ReeImpFact"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Opcion_Click(Index As Integer)
Select Case Index
    Case 1:
            Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
            Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
            Do While Not TrsEncabFact.EOF
                TrsEncabFact.Delete
                TrsEncabFact.MoveNext
            Loop
            Do While Not TrsDetFact.EOF
                TrsDetFact.Delete
                TrsDetFact.MoveNext
            Loop
            Call ConsultaFactVieja(NroFact)
            Dim frmRep As New InfFactura
            frmRep.Show vbModal
    Case 0:
            Call Imprime_Fact(NroFact)
End Select
End Sub
